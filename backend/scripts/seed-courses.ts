/**
 * Seed sample courses (requires departments and optionally dept id 1).
 * Usage: cd backend && npx tsx scripts/seed-courses.ts
 */
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createConnection } from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const COURSES = [
  { id: 'CS301', name: 'Data Structures', credits: 4, dept: 'CSE', sem: 3, capacity: 60, slot: 'A', faculty: 'Dr. Smith' },
  { id: 'CS302', name: 'Algorithms', credits: 4, dept: 'CSE', sem: 3, capacity: 60, slot: 'B', faculty: 'Dr. Jane' },
  { id: 'MA301', name: 'Discrete Mathematics', credits: 3, dept: 'CSE', sem: 3, capacity: 80, slot: 'A', faculty: 'Dr. Kumar' },
];

async function main() {
  const conn = await createConnection({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'course_allotment',
  });
  for (const c of COURSES) {
    await conn.execute('CALL sp_seed_course(?, ?, ?, ?, ?, ?, ?, ?)', [
      c.id,
      c.name,
      c.credits,
      c.dept,
      c.sem,
      c.capacity,
      c.slot,
      c.faculty,
    ]);
  }
  console.log('Sample courses seeded:', COURSES.map((c) => c.id).join(', '));
  await conn.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
