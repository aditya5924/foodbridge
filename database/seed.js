import 'dotenv/config';
import bcrypt from 'bcryptjs';
import {pool} from '../config/db.js';
const email=process.env.SEED_ADMIN_EMAIL;const password=process.env.SEED_ADMIN_PASSWORD;
if(!email||!password||password==='change_me_before_seeding'||password.length<8)throw new Error('Set SEED_ADMIN_EMAIL and a strong SEED_ADMIN_PASSWORD in .env');
try{
 const hash=await bcrypt.hash(password,12);
 await pool.query(`INSERT INTO users(name,email,password_hash,role) VALUES('FoodBridge Admin',$1,$2,'admin') ON CONFLICT(email) DO NOTHING`,[email.toLowerCase(),hash]);
 console.log('Admin seed complete (existing account not overwritten)');
}finally{await pool.end();}
