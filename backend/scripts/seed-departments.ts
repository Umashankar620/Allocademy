/**
 * Seed DEPARTMENT table with default departments (required before student signup).
 * Usage: cd backend && npx tsx scripts/seed-departments.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createConnection } from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'EE', 'MECH', 'CIVIL', 'MNC', 'Other', 'Others'];

async function main() {
  const conn = await createConnection({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'course_allotment',
  });
  for (const name of DEPARTMENTS) {
    await conn.execute('CALL sp_seed_department(?)', [name]);
  }
  console.log('Departments seeded:', DEPARTMENTS.join(', '));
  await conn.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
