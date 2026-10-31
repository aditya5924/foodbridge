import {Router} from 'express';
import {z} from 'zod';
import {query,tx} from '../config/db.js';
import {authenticate,permit,asyncRoute,fail} from '../middleware/auth.js';
import {note,parse} from '../services/helpers.js';
const r=Router();r.use(authenticate);
const cols='id,donation_id AS "donationId",reporter_id AS "reporterId",severity,description,photo_url AS "photoUrl",status,created_at AS "createdAt",resolved_at AS "resolvedAt"';
r.get('/',permit('admin'),asyncRoute(async(req,res)=>{const {rows}=await query(`SELECT ${cols} FROM incidents ORDER BY created_at DESC LIMIT 300`);res.json(rows);}));
r.post('/',parse(z.object({donationId:z.string().uuid(),severity:z.enum(['low','medium','high','critical']),description:z.string().min(8),photoUrl:z.string().optional()})),asyncRoute(async(req,res)=>{
 const {donationId,severity,description,photoUrl}=req.body;
 const {rows}=await query(`INSERT INTO incidents(donation_id,reporter_id,severity,description,photo_url) VALUES($1,$2,$3,$4,$5) RETURNING ${cols}`,[donationId,req.user.id,severity,description,photoUrl||null]);res.status(201).json(rows[0]);
}));
r.post('/:id/resolve',permit('admin'),asyncRoute(async(req,res)=>{const resolution=String(req.body?.resolution||'').trim();if(!resolution)throw fail(422,'VALIDATION_ERROR','Resolution required');const {rows}=await query(`UPDATE incidents SET status='resolved',resolution=$2,resolved_at=now() WHERE id=$1 AND status='open' RETURNING ${cols}`,[req.params.id,resolution]);if(!rows[0])throw fail(409,'INVALID_STATUS','Incident not found or already resolved');res.json(rows[0]);}));
export default r;
