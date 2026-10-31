import {Router} from 'express';
import bcrypt from 'bcryptjs';
import {query,tx} from '../config/db.js';
import {authenticate,permit,asyncRoute,fail,ensure} from '../middleware/auth.js';
import {note,notify} from '../services/helpers.js';
import {decryptCode} from '../services/crypto.js';
const r=Router();r.use(authenticate);
const base=`SELECT p.id,p.donation_id AS "donationId",p.organization_id AS "organizationId",p.volunteer_id AS "volunteerId",p.status,d.pickup_start AS "pickupStart",d.pickup_end AS "pickupEnd",d.lat,d.lng,d.location,p.proof_url AS "proofUrl" FROM pickups p JOIN donations d ON d.id=p.donation_id`;
const canSee=(p,user)=>user.role==='admin'||(user.role==='organization'&&p.organizationId===user.organizationId)||(user.role==='volunteer'&&(p.volunteerId===user.id||p.status==='open'))||(user.role==='donor'&&p.donorId===user.id);
r.get('/',asyncRoute(async(req,res)=>{
 const args=[],where=[];
 if(req.user.role==='organization'){args.push(req.user.organizationId);where.push(`p.organization_id=$${args.length}`);}
 if(req.user.role==='volunteer'){args.push(req.user.id);where.push(`(p.volunteer_id=$${args.length} OR p.status='open')`);}
 if(req.user.role==='donor'){args.push(req.user.id);where.push(`d.donor_id=$${args.length}`);}
 if(req.query.volunteerId){ensure(req.user.role==='admin'||req.user.id===req.query.volunteerId);args.push(req.query.volunteerId);where.push(`p.volunteer_id=$${args.length}`);}
 if(req.query.status){args.push(req.query.status);where.push(`p.status=$${args.length}`);}
 const {rows}=await query(`${base} ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY d.pickup_end ASC LIMIT 300`,args);res.json(rows);
}));
r.get('/:id',asyncRoute(async(req,res)=>{
 const {rows}=await query(`${base} WHERE p.id=$1`,[req.params.id]);const p=rows[0];if(!p)throw fail(404,'NOT_FOUND','Pickup not found');
 if(!canSee(p,req.user)){if(req.user.role==='donor'){const d=await query('SELECT donor_id FROM donations WHERE id=$1',[p.donationId]);ensure(d.rows[0]?.donor_id===req.user.id);}else throw fail(403,'FORBIDDEN','Not permitted');}
 res.json(p);
}));
r.post('/:id/accept',permit('volunteer'),asyncRoute(async(req,res)=>{
 await tx(async c=>{
  const {rows}=await c.query('SELECT p.*,d.title,d.pickup_end FROM pickups p JOIN donations d ON d.id=p.donation_id WHERE p.id=$1 FOR UPDATE OF p',[req.params.id]);const p=rows[0];if(!p)throw fail(404,'NOT_FOUND','Pickup not found');
  if(p.status!=='open'||new Date(p.pickup_end)<=new Date())throw fail(409,'INVALID_STATUS','Pickup is not open');
  await c.query("UPDATE pickups SET status='assigned',volunteer_id=$2,updated_at=now() WHERE id=$1",[p.id,req.user.id]);await note(c,p.donation_id,req.user,'Volunteer accepted pickup','assigned');
  const {rows:users}=await c.query('SELECT id FROM users WHERE organization_id=$1',[p.organization_id]);for(const u of users)await notify(c,u.id,`Volunteer assigned for ${p.title}`,'pickup');
 });const {rows}=await query(`${base} WHERE p.id=$1`,[req.params.id]);res.json(rows[0]);
}));
r.post('/:id/assign',permit('admin'),asyncRoute(async(req,res)=>{
 const {volunteerId}=req.body||{};
 await tx(async c=>{
  const {rows:vv}=await c.query("SELECT id FROM users WHERE id=$1 AND role='volunteer'",[volunteerId]);if(!vv[0])throw fail(422,'VALIDATION_ERROR','Invalid volunteer');
  const {rows}=await c.query('SELECT * FROM pickups WHERE id=$1 FOR UPDATE',[req.params.id]);const p=rows[0];if(!p)throw fail(404,'NOT_FOUND','Pickup not found');if(!['open','assigned'].includes(p.status))throw fail(409,'INVALID_STATUS','Pickup cannot be assigned');
  if(p.volunteer_id&&p.volunteer_id!==volunteerId)await notify(c,p.volunteer_id,'Your pickup was reassigned','recovery');
  await c.query("UPDATE pickups SET status='assigned',volunteer_id=$2,updated_at=now() WHERE id=$1",[p.id,volunteerId]);await note(c,p.donation_id,req.user,'Volunteer assigned','assigned');await notify(c,volunteerId,'You have a pickup assignment','pickup');
 });const {rows}=await query(`${base} WHERE p.id=$1`,[req.params.id]);res.json(rows[0]);
}));
r.get('/:id/handover-code',permit('organization'),asyncRoute(async(req,res)=>{
 const {rows}=await query('SELECT organization_id,handover_code_encrypted FROM pickups WHERE id=$1',[req.params.id]);if(!rows[0])throw fail(404,'NOT_FOUND','Pickup not found');ensure(rows[0].organization_id===req.user.organizationId);
 res.json({id:req.params.id,code:decryptCode(rows[0].handover_code_encrypted)});
}));
r.post('/:id/handover',permit('volunteer'),asyncRoute(async(req,res)=>{
 const {code,proofUrl}=req.body||{};if(!/^\d{6}$/.test(String(code||''))||typeof proofUrl!=='string'||!proofUrl)throw fail(422,'VALIDATION_ERROR','Six-digit code and proofUrl required');
 await tx(async c=>{
  const {rows}=await c.query('SELECT p.*,d.donor_id,d.title,d.expires_at FROM pickups p JOIN donations d ON d.id=p.donation_id WHERE p.id=$1 FOR UPDATE OF p,d',[req.params.id]);const p=rows[0];if(!p)throw fail(404,'NOT_FOUND','Pickup not found');ensure(p.volunteer_id===req.user.id);
  if(p.status!=='assigned'||new Date(p.expires_at)<=new Date())throw fail(409,'INVALID_STATUS','Pickup is not eligible for handover');
  if(!(await bcrypt.compare(String(code),p.handover_code_hash)))throw fail(422,'INVALID_CODE','Handover code is incorrect');
  await c.query("UPDATE pickups SET status='delivered',proof_url=$2,updated_at=now() WHERE id=$1",[p.id,proofUrl]);
  await c.query("UPDATE donations SET status='delivered' WHERE id=$1",[p.donation_id]);
  await c.query("UPDATE reservations SET status='delivered',updated_at=now() WHERE id=$1",[p.reservation_id]);
  await note(c,p.donation_id,req.user,'Handover verified','delivered');await notify(c,p.donor_id,`Your donation ${p.title} was delivered`,'delivered');
 });const {rows}=await query(`${base} WHERE p.id=$1`,[req.params.id]);res.json(rows[0]);
}));
export default r;
