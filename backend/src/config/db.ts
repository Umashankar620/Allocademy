import mysql from 'mysql2/promise';

const pool = mysql.createPool({
  host: process.env.DB_HOST ?? 'localhost',
  port: Number(process.env.DB_PORT) || 3306,
  user: process.env.DB_USER ?? 'root',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'course_allotment',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
});

export async function query<T>(sql: string, params?: unknown[]): Promise<T> {
  const [rows] = await pool.execute(sql, params);
  return rows as T;
}

export async function callProcedure<T>(name: string, params: unknown[] = []): Promise<T[]> {
  const placeholders = params.map(() => '?').join(', ');
  const sql = `CALL ${name}(${placeholders})`;
  const [rows] = await pool.query(sql, params);

  if (Array.isArray(rows)) {
    const first = Array.isArray(rows[0]) ? rows[0] : rows;
    return first as unknown as T[];
  }

  return [];
}

export default pool;
