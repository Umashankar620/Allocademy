import { Router, Request, Response } from 'express';
import { callProcedure } from '../config/db.js';
import { hashPassword, comparePassword, signAccessToken, signRefreshToken, verifyRefreshToken } from '../lib/auth.js';
import { authMiddleware, type AuthLocals } from '../middleware/auth.js';

const router = Router();

const COLLEGE_EMAIL_SUFFIX = '@nith.ac.in';

function isCollegeEmail(email: string): boolean {
  return typeof email === 'string' && email.toLowerCase().endsWith(COLLEGE_EMAIL_SUFFIX);
}

type StudentRow = { Roll_No: string; Name: string; Email: string; Department_ID: number | null; Semester: number; CGPA: number | null; Password: string; Status: string };
type AdminRow = { Admin_ID: number; Name: string; Email: string; Password: string };
type DeptRow = { Department_ID: number; Department_Name: string };

// POST /auth/signup
router.post('/signup', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, roll_no, email, department, semester, password } = req.body as Record<string, unknown>;
    if (!name || !roll_no || !email || !department || typeof semester !== 'number' || !password) {
      res.status(400).json({ error: 'Missing or invalid fields: name, roll_no, email, department, semester, password' });
      return;
    }
    const emailStr = String(email).trim().toLowerCase();
    if (!isCollegeEmail(emailStr)) {
      res.status(400).json({ error: 'Only official college email (@nith.ac.in) is allowed' });
      return;
    }
    const rollNoStr = String(roll_no).trim();
    const depts = await callProcedure<DeptRow>('sp_get_department_by_name', [String(department)]);
    if (depts.length === 0) {
      res.status(400).json({ error: 'Invalid department' });
      return;
    }
    const departmentId = depts[0].Department_ID;
    const existing = await callProcedure<{ Roll_No: string }>('sp_get_student_by_email_or_roll', [emailStr, rollNoStr]);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Email or roll number already registered' });
      return;
    }
    const passwordHash = await hashPassword(String(password));
    await callProcedure('sp_insert_student', [
      rollNoStr,
      String(name),
      emailStr,
      passwordHash,
      departmentId,
      Number(semester),
      'inactive',
    ]);
    res.status(201).json({ message: 'Signup successful. Await admin approval.' });
  } catch (err) {
    console.error('Signup error:', err);
    res.status(500).json({ error: 'Signup failed' });
  }
});

// POST /auth/login
router.post('/login', async (req: Request, res: Response): Promise<void> => {
  try {
    const { email_or_roll, password } = req.body as Record<string, unknown>;
    if (!email_or_roll || !password) {
      res.status(400).json({ error: 'email_or_roll and password required' });
      return;
    }
    const key = String(email_or_roll).trim();
    const students = await callProcedure<StudentRow>('sp_get_student_by_email_or_roll', [key, key]);
    if (students.length > 0) {
      const student = students[0];
      const ok = await comparePassword(String(password), student.Password);
      if (!ok) {
        res.status(401).json({ error: 'Invalid password' });
        return;
      }
      if (student.Status !== 'active') {
        res.status(403).json({ error: 'Account pending approval' });
        return;
      }
      let departmentName: string | null = null;
      if (student.Department_ID) {
        const dept = await callProcedure<DeptRow>('sp_get_department_by_id', [student.Department_ID]);
        if (dept.length > 0) departmentName = dept[0].Department_Name;
      }
      const access = signAccessToken({ sub: student.Roll_No, role: 'student' });
      const refresh = signRefreshToken({ sub: student.Roll_No, role: 'student' });
      res.json({
        role: 'student',
        accessToken: access,
        refreshToken: refresh,
        user: { id: student.Roll_No, name: student.Name, roll_no: student.Roll_No, email: student.Email, department: departmentName, semester: student.Semester, cgpa: student.CGPA, status: student.Status },
      });
      return;
    }
    // Try admin by Admin_ID (numeric) or email
    let admins: AdminRow[] = [];
    if (/^\d+$/.test(key)) {
      admins = await callProcedure<AdminRow>('sp_get_admin_by_id', [Number(key)]);
    }
    if (admins.length === 0) {
      admins = await callProcedure<AdminRow>('sp_get_admin_by_email', [key]);
    }
    if (admins.length > 0) {
      const admin = admins[0];
      const ok = await comparePassword(String(password), admin.Password);
      if (!ok) {
        res.status(401).json({ error: 'Invalid password' });
        return;
      }
      const access = signAccessToken({ sub: String(admin.Admin_ID), role: 'admin' });
      const refresh = signRefreshToken({ sub: String(admin.Admin_ID), role: 'admin' });
      res.json({ role: 'admin', accessToken: access, refreshToken: refresh, user: { id: admin.Admin_ID, name: admin.Name, email: admin.Email } });
      return;
    }
    res.status(401).json({ error: 'Invalid email or roll number' });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /auth/refresh
router.post('/refresh', (req: Request, res: Response): void => {
  const { refreshToken } = req.body as { refreshToken?: string };
  if (!refreshToken) {
    res.status(400).json({ error: 'refreshToken required' });
    return;
  }
  try {
    const payload = verifyRefreshToken(refreshToken);
    const access = signAccessToken({ sub: payload.sub, role: payload.role });
    res.json({ accessToken: access });
  } catch {
    res.status(401).json({ error: 'Invalid or expired refresh token' });
  }
});

// POST /auth/logout - client discards tokens; optional server blacklist not implemented here
router.post('/logout', (_req: Request, res: Response): void => {
  res.json({ message: 'Logged out' });
});

// GET /auth/me - current user (requires auth)
router.get('/me', authMiddleware, (_req: Request, res: Response): void => {
  const locals = (res as Response & { locals: AuthLocals }).locals;
  res.json({ user: locals.user });
});

// POST /auth/forgot-password - placeholder; Phase 2: send reset email
router.post('/forgot-password', (req: Request, res: Response): void => {
  const { email } = req.body as { email?: string };
  if (!email) {
    res.status(400).json({ error: 'Email required' });
    return;
  }
  res.json({ message: 'If this email is registered, you will receive a reset link.' });
});

export default router;
