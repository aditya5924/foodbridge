import {Router} from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import {z} from 'zod';
import {query,tx} from '../config/db.js';
import {authenticate,asyncRoute,fail,permit} from '../middleware/auth.js';
import {parse} from '../services/helpers.js';
const r=Router();
const cleanUser = u => ({id:u.id,name:u.name,email:u.email,role:u.role,organizationId:u.organizationId,organization:u.organization||undefined});
const tokenFor = user => jwt.sign({sub:user.id},process.env.JWT_SECRET,{algorithm:'HS256',expiresIn:process.env.JWT_EXPIRES_IN||'8h'});
const registration=z.object({name:z.string().trim().min(2).max(120),email:z.string().email().transform(x=>x.toLowerCase()),password:z.string().min(8).max(128),role:z.enum(['donor','organization','volunteer']),organization:z.union([z.string(),z.object({name:z.string(),location:z.string().optional()})]).optional()});
r.post('/register',parse(registration),asyncRoute(async(req,res)=>{
 const {name,email,password,role,organization}=req.body;
 const exists=await query('SELECT 1 FROM users WHERE email=$1',[email]);if(exists.rowCount) throw fail(409,'EMAIL_EXISTS','Email already registered');
 const hash=await bcrypt.hash(password,12);
 const user=await tx(async c=>{
  let organizationId=null;
  if(role==='organization'){
   const orgName=typeof organization==='string'?organization:organization?.name;
   if(!orgName?.trim()) throw fail(422,'VALIDATION_ERROR','Organization name is required');
   const org=await c.query('INSERT INTO organizations(name,location) VALUES($1,$2) RETURNING id',[orgName,typeof organization==='object'?organization.location||'':'']);organizationId=org.rows[0].id;
  }
  const result=await c.query('INSERT INTO users(name,email,password_hash,role,organization_id) VALUES($1,$2,$3,$4,$5) RETURNING id,name,email,role,organization_id AS "organizationId"',[name,email,hash,role,organizationId]);return result.rows[0];
 });
 res.status(201).json({accessToken:tokenFor(user),user:cleanUser(user)});
}));
r.post('/login',parse(z.object({email:z.string().email(),password:z.string()})),asyncRoute(async(req,res)=>{
 const {rows}=await query('SELECT id,name,email,role,organization_id AS "organizationId",password_hash FROM users WHERE email=$1',[req.body.email.toLowerCase()]);
 const user=rows[0];if(!user || !(await bcrypt.compare(req.body.password,user.password_hash))) throw fail(401,'INVALID_CREDENTIALS','Invalid email or password');
 res.json({accessToken:tokenFor(user),user:cleanUser(user)});
}));
r.get('/me',authenticate,asyncRoute(async(req,res)=>res.json(cleanUser(req.user))));
r.patch('/me',authenticate,parse(z.object({name:z.string().trim().min(2).max(120)})),asyncRoute(async(req,res)=>{
 const {rows}=await query('UPDATE users SET name=$1 WHERE id=$2 RETURNING id,name,email,role,organization_id AS "organizationId"',[req.body.name,req.user.id]);res.json(cleanUser(rows[0]));
}));
export default r;
