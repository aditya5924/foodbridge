import {Router} from 'express';
import {randomInt} from 'node:crypto';
import bcrypt from 'bcryptjs';
import {z} from 'zod';
import {query,tx} from '../config/db.js';
import {authenticate,permit,asyncRoute,fail,ensure} from '../middleware/auth.js';
import {one,note,notify,parse} from '../services/helpers.js';
const r=Router();r.use(authenticate);
const fields=`d.id,d.donor_id AS "donorId",d.title,d.category,d.quantity::float AS quantity,d.unit,d.prepared_at AS "preparedAt",d.pickup_start AS "pickupStart",d.pickup_end AS "pickupEnd",d.expires_at AS "expiresAt",d.storage,d.location,d.lat,d.lng,d.photo_url AS "photoUrl",d.status,d.safety,d.created_at AS "createdAt",json_build_object('id',u.id,'name',u.name) AS donor`;
const from='FROM donations d JOIN users u ON u.id=d.donor_id';
const getDonation=async(id,c=query)=>{const {rows}=await c(`SELECT ${fields} ${from} WHERE d.id=$1`,[id]);if(!rows[0])throw fail(404,'NOT_FOUND','Donation not found');return rows[0];};
const createSchema=z.object({title:z.string().min(2),category:z.string().min(1),quantity:z.coerce.number().positive(),unit:z.string().min(1),preparedAt:z.string().datetime({offset:true}),pickupStart:z.string().datetime({offset:true}),pickupEnd:z.string().datetime({offset:true}),expiresAt:z.string().datetime({offset:true}),storage:z.string().default(''),location:z.string().min(2),lat:z.number().min(-90).max(90).nullable().optional(),lng:z.number().min(-180).max(180).nullable().optional(),photoUrl:z.string().optional()});
r.get('/',asyncRoute(async(req,res)=>{
 const args=[];const filters=[];
 if(req.query.status){args.push(req.query.status);filters.push(`d.status=$${args.length}`);}
 if(req.query.category){args.push(req.query.category);filters.push(`d.category=$${args.length}`);}
 if(req.query.donorId){ensure(req.user.role==='admin'||req.user.id===req.query.donorId);args.push(req.query.donorId);filters.push(`d.donor_id=$${args.length}`);}
 const {rows}=await query(`SELECT ${fields} ${from} ${filters.length?'WHERE '+filters.join(' AND '):''} ORDER BY d.expires_at ASC LIMIT 300`,args);res.json(rows);
}));
r.post('/',permit('donor'),parse(createSchema),asyncRoute(async(req,res)=>{
 const b=req.body;
 if(Date.parse(b.pickupEnd)<=Date.parse(b.pickupStart)||Date.parse(b.expiresAt)<=Date.now())throw fail(422,'VALIDATION_ERROR','Invalid pickup or expiry times');
 const row=await tx(async c=>{
  const {rows}=await c.query(`INSERT INTO donations(donor_id,title,category,quantity,unit,prepared_at,pickup_start,pickup_end,expires_at,storage,location,lat,lng,photo_url,safety)
   VALUES($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,'passed') RETURNING id`,
   [req.user.id,b.title,b.category,b.quantity,b.unit,b.preparedAt,b.pickupStart,b.pickupEnd,b.expiresAt,b.storage,b.location,b.lat??null,b.lng??null,b.photoUrl??null]);
  await note(c,rows[0].id,req.user,'Donation created','available');return rows[0];
 });res.status(201).json(await getDonation(row.id));
}));
r.get('/:id',asyncRoute(async(req,res)=>{
 const d=await getDonation(req.params.id);
 const {rows}=await query(`SELECT r.id AS "reservationId",o.id AS "organizationId",o.name AS organization,u.id AS "volunteerId",u.name AS volunteer FROM reservations r JOIN organizations o ON o.id=r.organization_id LEFT JOIN pickups p ON p.reservation_id=r.id AND p.status NOT IN ('cancelled','missed') LEFT JOIN users u ON u.id=p.volunteer_id WHERE r.donation_id=$1 AND r.status IN ('reserved','accepted','collected','delivered') ORDER BY r.created_at DESC LIMIT 1`,[d.id]);
 res.json({...d,...rows[0]});
}));
r.post('/:id/cancel',permit('donor','admin'),asyncRoute(async(req,res)=>{
 await tx(async c=>{
  const {rows}=await c.query('SELECT * FROM donations WHERE id=$1 FOR UPDATE',[req.params.id]);const d=rows[0];if(!d)throw fail(404,'NOT_FOUND','Donation not found');ensure(req.user.role==='admin'||d.donor_id===req.user.id);
  if(!['available','reserved','accepted'].includes(d.status))throw fail(409,'INVALID_STATUS','Donation cannot be cancelled at this stage');
  await c.query("UPDATE donations SET status='cancelled' WHERE id=$1",[d.id]);
  const {rows:rr}=await c.query("UPDATE reservations SET status='cancelled',updated_at=now() WHERE donation_id=$1 AND status IN ('reserved','accepted') RETURNING organization_id",[d.id]);
  const {rows:pp}=await c.query("UPDATE pickups SET status='cancelled',updated_at=now() WHERE donation_id=$1 AND status IN ('open','assigned') RETURNING volunteer_id",[d.id]);
  for(const x of rr){const {rows:uu}=await c.query('SELECT id FROM users WHERE organization_id=$1',[x.organization_id]);for(const u of uu)await notify(c,u.id,`Donation ${d.title} was cancelled`,'cancelled');}
  for(const p of pp)await notify(c,p.volunteer_id,`Pickup for ${d.title} was cancelled`,'cancelled');
  await note(c,d.id,req.user,'Donation cancelled','cancelled',req.body?.reason||null);
 });res.json(await getDonation(req.params.id));
}));
r.get('/:id/events',asyncRoute(async(req,res)=>{
 const d=await getDonation(req.params.id);ensure(req.user.role==='admin'||req.user.id===d.donorId||req.user.role==='organization'||req.user.role==='volunteer');
 const {rows}=await query(`SELECT id,donation_id AS "donationId",json_build_object('id',actor_id,'name',actor_name,'role',actor_role) AS actor,action,status,created_at AS "createdAt",notes FROM donation_events WHERE donation_id=$1 ORDER BY created_at,id`,[d.id]);res.json(rows);
}));
r.get('/:id/matches',permit('donor','admin','organization'),asyncRoute(async(req,res)=>{
 const d=await getDonation(req.params.id);const {rows}=await query("SELECT id AS \"organizationId\",name AS \"organizationName\",status,capacity,need FROM organizations WHERE status='verified' ORDER BY name LIMIT 100");
 // Scores must be computed by an agreed matching engine. Return explicit unavailable state rather than invented scores.
 res.json(rows.map(x=>({organizationId:x.organizationId,organizationName:x.organizationName,score:null,breakdown:null,distanceKm:null,eligible:false,reason:'Matching engine not configured'})));
}));
export default r;
