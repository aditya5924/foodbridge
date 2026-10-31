import {Router} from 'express';
import {query} from '../config/db.js';
import {authenticate,permit,asyncRoute,fail} from '../middleware/auth.js';
const r=Router();r.use(authenticate);
const cols='id,name,location,capacity,need,status,lat,lng';
r.get('/',asyncRoute(async(req,res)=>{const {rows}=await query(`SELECT ${cols} FROM organizations ORDER BY created_at DESC`);res.json(rows);}));
r.post('/:id/verify',permit('admin'),asyncRoute(async(req,res)=>{const {rows}=await query(`UPDATE organizations SET status='verified',reject_reason=NULL WHERE id=$1 RETURNING ${cols}`,[req.params.id]);if(!rows[0])throw fail(404,'NOT_FOUND','Organization not found');res.json(rows[0]);}));
r.post('/:id/reject',permit('admin'),asyncRoute(async(req,res)=>{const reason=String(req.body?.reason||'').trim();if(!reason)throw fail(422,'VALIDATION_ERROR','Rejection reason required');const {rows}=await query(`UPDATE organizations SET status='rejected',reject_reason=$2 WHERE id=$1 RETURNING ${cols}`,[req.params.id,reason]);if(!rows[0])throw fail(404,'NOT_FOUND','Organization not found');res.json(rows[0]);}));
export default r;
