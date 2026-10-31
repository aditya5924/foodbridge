import {Router} from 'express';
import bcrypt from 'bcryptjs';
import {randomInt} from 'node:crypto';
import {query,tx} from '../config/db.js';
import {authenticate,permit,asyncRoute,fail,ensure} from '../middleware/auth.js';
import {note,notify} from '../services/helpers.js';
import {encryptCode} from '../services/crypto.js';
const r=Router();r.use(authenticate);
const select=`SELECT r.id,r.donation_id AS "donationId",r.organization_id AS "organizationId",o.name AS organization,r.status,r.created_at AS "createdAt",r.updated_at AS "updatedAt" FROM reservations r JOIN organizations o ON o.id=r.organization_id`;
r.get('/',asyncRoute(async(req,res)=>{
 let where=[],args=[];
 if(req.user.role==='organization'){args.push(req.user.organizationId);where.push(`r.organization_id=$${args.length}`);}
 else if(req.user.role==='donor'){args.push(req.user.id);where.push(`r.donation_id IN (SELECT id FROM donations WHERE donor_id=$${args.length})`);}
 else if(req.user.role==='volunteer'){args.push(req.user.id);where.push(`r.id IN (SELECT reservation_id FROM pickups WHERE volunteer_id=$${args.length})`);}
 if(req.query.organizationId){ensure(req.user.role==='admin'||req.query.organizationId===req.user.organizationId);args.push(req.query.organizationId);where.push(`r.organization_id=$${args.length}`);}
 if(req.query.status){args.push(req.query.status);where.push(`r.status=$${args.length}`);}
 const {rows}=await query(`${select} ${where.length?'WHERE '+where.join(' AND '):''} ORDER BY r.created_at DESC LIMIT 300`,args);res.json(rows);
}));
r.post('/',permit('organization'),asyncRoute(async(req,res)=>{
 const {donationId,organizationId}=req.body||{};ensure(organizationId===req.user.organizationId,403,'Organization mismatch');
 const id=await tx(async c=>{
  const {rows:oo}=await c.query('SELECT status FROM organizations WHERE id=$1',[organizationId]);ensure(oo[0]?.status==='verified',403,'Organization verification is pending');
  const {rows:dd}=await c.query('SELECT * FROM donations WHERE id=$1 FOR UPDATE',[donationId]);const d=dd[0];if(!d)throw fail(404,'NOT_FOUND','Donation not found');
  if(d.status!=='available'||d.safety!=='passed'||new Date(d.expires_at)<=new Date()||new Date(d.pickup_end)<=new Date())throw fail(409,'INVALID_STATUS','Donation is unavailable or expired');
  const {rows:rr}=await c.query('INSERT INTO reservations(donation_id,organization_id) VALUES($1,$2) RETURNING id',[donationId,organizationId]);
  await c.query("UPDATE donations SET status='reserved' WHERE id=$1",[donationId]);
  await note(c,donationId,req.user,'Reserved by organization','reserved');await notify(c,d.donor_id,`Your donation ${d.title} has been reserved`,'reservation');return rr[0].id;
 });const {rows}=await query(`${select} WHERE r.id=$1`,[id]);res.status(201).json(rows[0]);
}));
r.post('/:id/accept',permit('organization'),asyncRoute(async(req,res)=>{
 await tx(async c=>{
  const {rows}=await c.query('SELECT r.*,d.donor_id,d.title,d.expires_at,d.pickup_end FROM reservations r JOIN donations d ON d.id=r.donation_id WHERE r.id=$1 FOR UPDATE OF r,d',[req.params.id]);const rr=rows[0];if(!rr)throw fail(404,'NOT_FOUND','Reservation not found');ensure(rr.organization_id===req.user.organizationId);
  if(rr.status!=='reserved'||new Date(rr.expires_at)<=new Date()||new Date(rr.pickup_end)<=new Date())throw fail(409,'INVALID_STATUS','Reservation cannot be accepted');
  await c.query("UPDATE reservations SET status='accepted',updated_at=now() WHERE id=$1",[rr.id]);await c.query("UPDATE donations SET status='accepted' WHERE id=$1",[rr.donation_id]);
  const code=String(randomInt(100000,999999));const hash=await bcrypt.hash(code,10);
  await c.query('INSERT INTO pickups(donation_id,reservation_id,organization_id,handover_code_hash,handover_code_encrypted) VALUES($1,$2,$3,$4,$5)',[rr.donation_id,rr.id,rr.organization_id,hash,encryptCode(code)]);
  await note(c,rr.donation_id,req.user,'Reservation accepted','accepted');await notify(c,rr.donor_id,`Organization accepted ${rr.title}`,'reservation');
 });const {rows}=await query(`${select} WHERE r.id=$1`,[req.params.id]);res.json(rows[0]);
}));
r.post('/:id/decline',permit('organization'),asyncRoute(async(req,res)=>{
 const reason=String(req.body?.reason||'').trim();if(!reason)throw fail(422,'VALIDATION_ERROR','Decline reason required');
 await tx(async c=>{
  const {rows}=await c.query('SELECT r.*,d.donor_id,d.title FROM reservations r JOIN donations d ON d.id=r.donation_id WHERE r.id=$1 FOR UPDATE OF r,d',[req.params.id]);const rr=rows[0];if(!rr)throw fail(404,'NOT_FOUND','Reservation not found');ensure(rr.organization_id===req.user.organizationId);
  if(rr.status!=='reserved')throw fail(409,'INVALID_STATUS','Only reserved items can be declined');
  await c.query("UPDATE reservations SET status='declined',decline_reason=$2,updated_at=now() WHERE id=$1",[rr.id,reason]);await c.query("UPDATE donations SET status='available' WHERE id=$1",[rr.donation_id]);
  await note(c,rr.donation_id,req.user,'Reservation declined','available',reason);await notify(c,rr.donor_id,`Reservation declined for ${rr.title}`,'reservation');
 });const {rows}=await query(`${select} WHERE r.id=$1`,[req.params.id]);res.json(rows[0]);
}));
export default r;
