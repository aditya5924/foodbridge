import pg from 'pg';
import 'dotenv/config';
export const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
export async function tx(fn) {
  const client = await pool.connect();
  try { await client.query('BEGIN'); const value = await fn(client); await client.query('COMMIT'); return value; }
  catch (error) { await client.query('ROLLBACK'); throw error; }
  finally { client.release(); }
}
export const query = (sql, params=[]) => pool.query(sql,params);
