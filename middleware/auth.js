import jwt from 'jsonwebtoken';
import { query } from '../config/db.js';
export const fail = (status,code,message,details) => Object.assign(new Error(message),{status,code,details});
export const asyncRoute = fn => (req,res,next)=>Promise.resolve(fn(req,res,next)).catch(next);
export const authenticate = asyncRoute(async (req,res,next) => {
  const token = /^Bearer (.+)$/i.exec(req.headers.authorization || '')?.[1];
  if (!token) throw fail(401,'UNAUTHORIZED','Sign in to continue');
  let payload;
  try { payload=jwt.verify(token,process.env.JWT_SECRET,{algorithms:['HS256']}); }
  catch { throw fail(401,'UNAUTHORIZED','Session expired or invalid'); }
  const {rows} = await query('SELECT id,name,email,role,organization_id AS "organizationId" FROM users WHERE id=$1',[payload.sub]);
  if (!rows[0]) throw fail(401,'UNAUTHORIZED','Account not found');
  req.user=rows[0]; next();
});
export const permit = (...roles) => (req,res,next)=>roles.includes(req.user?.role)?next():next(fail(403,'FORBIDDEN','Insufficient permissions'));
export const ensure = (condition, status=403, message='Not permitted') => { if(!condition) throw fail(status,status===403?'FORBIDDEN':'INVALID_STATUS',message); };
