/**
 * Create a default admin user for testing.
 * Usage: cd backend && npx tsx scripts/seed-admin.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createConnection } from 'mysql2/promise';
import bcrypt from 'bcrypt';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const ADMIN_EMAIL = process.env.SEED_ADMIN_EMAIL ?? 'admin@nith.ac.in';
const ADMIN_PASSWORD = process.env.SEED_ADMIN_PASSWORD ?? 'admin@123';
const ADMIN_NAME = process.env.SEED_ADMIN_NAME ?? 'Admin';

async function main() {
  const conn = await createConnection({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'course_allotment',
  });
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);
  await conn.execute('CALL sp_seed_admin(?, ?, ?)', [ADMIN_NAME, ADMIN_EMAIL, hash]);
  console.log(`Admin created: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  await conn.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
