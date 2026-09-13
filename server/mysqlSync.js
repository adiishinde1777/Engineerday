import mysql from 'mysql2';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env') });

let pool = null;

if (process.env.DB_PASSWORD) {
  try {
    pool = mysql.createPool({
      host: process.env.DB_HOST || 'localhost',
      port: parseInt(process.env.DB_PORT || '3306', 10),
      user: process.env.DB_USER || 'root',
      password: process.env.DB_PASSWORD,
      database: process.env.DB_NAME || 'engineers_day',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0
    }).promise();
  } catch (err) {
    console.warn('[MySQL Sync] Pool initialization note:', err.message);
  }
}

export async function syncToMySQL(query, params = []) {
  if (!pool) return;
  try {
    await pool.query(query, params);
  } catch (err) {
    // Non-blocking: log note if MySQL is temporarily unreachable
    console.warn('[MySQL Sync Note]:', err.message);
  }
}

export default pool;
