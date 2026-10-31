import {Router} from 'express';
import {query} from '../config/db.js';
import {authenticate,asyncRoute,fail} from '../middleware/auth.js';
const r=Router();r.use(authenticate);
const cols='id,user_id AS "userId",text,read,type,created_at AS "createdAt"';
r.get('/',asyncRoute(async(req,res)=>{const {rows}=await query(`SELECT ${cols} FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 100`,[req.user.id]);res.json(rows);}));
r.patch('/:id/read',asyncRoute(async(req,res)=>{const {rows}=await query(`UPDATE notifications SET read=true WHERE id=$1 AND user_id=$2 RETURNING ${cols}`,[req.params.id,req.user.id]);if(!rows[0])throw fail(404,'NOT_FOUND','Notification not found');res.json(rows[0]);}));
export default r;
