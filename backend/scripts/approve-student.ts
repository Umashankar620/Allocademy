import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { createConnection } from 'mysql2/promise';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const email = process.argv[2] ?? 'test2@nith.ac.in';

async function main() {
  const conn = await createConnection({
    host: process.env.DB_HOST ?? 'localhost',
    port: Number(process.env.DB_PORT) || 3306,
    user: process.env.DB_USER ?? 'root',
    password: process.env.DB_PASSWORD ?? '',
    database: process.env.DB_NAME ?? 'course_allotment',
  });
  const [rows] = await conn.query('CALL sp_approve_student_by_email(?)', [email]);
  const resultSets = rows as Array<Array<{ affected_rows: number }>>;
  const affected = resultSets[0]?.[0]?.affected_rows ?? 0;
  console.log('Approved:', affected, 'student(s)');
  await conn.end();
}

main().catch((e) => { console.error(e); process.exit(1); });
