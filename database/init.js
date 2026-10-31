import {readFile} from 'node:fs/promises';
import {pool} from '../config/db.js';
const sql=await readFile(new URL('./schema.sql',import.meta.url),'utf8');
try {await pool.query(sql); console.log('FoodBridge schema initialized');}
finally {await pool.end();}
