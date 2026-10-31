import {Router} from 'express';
import {query} from '../config/db.js';
import {authenticate,permit,asyncRoute} from '../middleware/auth.js';
const r=Router();r.use(authenticate,permit('admin'));
r.get('/',asyncRoute(async(req,res)=>{const {rows}=await query('SELECT id,name,email,role,organization_id AS "organizationId" FROM users WHERE ($1::text IS NULL OR role=$1) ORDER BY name LIMIT 200',[req.query.role||null]);res.json(rows);}));
export default r;
