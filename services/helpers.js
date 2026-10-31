import {query} from '../config/db.js';
import {fail} from '../middleware/auth.js';
export const one = async (sql,values=[],notFound='Record not found') => {
 const {rows}=await query(sql,values); if(!rows[0]) throw fail(404,'NOT_FOUND',notFound); return rows[0];
};
export const note = async (client,donationId,user,action,status=null,notes=null) => client.query(
 'INSERT INTO donation_events(donation_id,actor_id,actor_name,actor_role,action,status,notes) VALUES($1,$2,$3,$4,$5,$6,$7)',
 [donationId,user?.id||null,user?.name||'System',user?.role||'system',action,status,notes]);
export const notify = async (client,userId,text,type='update') => {
 if(userId) await client.query('INSERT INTO notifications(user_id,text,type) VALUES($1,$2,$3)',[userId,text,type]);
};
export const rowDonation = row => ({...row,donor:row.donor||undefined});
export const parse = schema => (req,res,next) => {const result=schema.safeParse(req.body); if(!result.success) return next(fail(422,'VALIDATION_ERROR','Invalid request',{issues:result.error.issues}));req.body=result.data;next();};
