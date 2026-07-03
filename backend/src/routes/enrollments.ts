import { Router, Request, Response } from 'express';
import { callProcedure } from '../config/db.js';
import { authMiddleware, requireStudent, type AuthLocals } from '../middleware/auth.js';

const router = Router();

type EnrollmentRow = {
  COURSE_Course_ID: string;
  Status: string;
  Enrollment_Date: string;
  Course_Name: string;
  Credits: number;
  Department_ID: number | null;
  Semester: number | null;
};
type DeptRow = { Department_Name: string };
type CountRow = { cnt: number };

// GET /enrollments – current student's enrollments (for "My Enrollments" page)
router.get('/', authMiddleware, requireStudent, async (_req: Request, res: Response): Promise<void> => {
  try {
    const locals = (res as Response & { locals: AuthLocals }).locals;
    const rollNo = locals.user.sub;
    const rows = await callProcedure<EnrollmentRow>('sp_get_enrollments_by_student', [rollNo]);
    const result = await Promise.all(
      rows.map(async (r) => {
        let departmentName: string | null = null;
        if (r.Department_ID != null) {
          const d = await callProcedure<DeptRow>('sp_get_department_name_by_id', [r.Department_ID]);
          if (d.length > 0) departmentName = d[0].Department_Name;
        }
        return {
          course_id: r.COURSE_Course_ID,
          course_name: r.Course_Name,
          credits: r.Credits,
          department_name: departmentName,
          semester: r.Semester,
          enrollment_date: r.Enrollment_Date,
          status: r.Status,
        };
      })
    );
    res.json({ enrollments: result });
  } catch (err) {
    console.error('Get enrollments error:', err);
    res.status(500).json({ error: 'Failed to fetch enrollments' });
  }
});

// POST /enrollments/:courseId – enroll in a course (direct enrollment)
router.post('/:courseId', authMiddleware, requireStudent, async (req: Request, res: Response): Promise<void> => {
  try {
    const locals = (res as Response & { locals: AuthLocals }).locals;
    const rollNo = locals.user.sub;
    const courseId = String(req.params.courseId).trim();
    if (!courseId) {
      res.status(400).json({ error: 'Course ID required' });
      return;
    }
    const courseRows = await callProcedure<{ Course_ID: string; Status: string; Capacity: number }>('sp_get_course_by_id', [courseId]);
    if (courseRows.length === 0) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    const course = courseRows[0];
    if (course.Status !== 'active') {
      res.status(400).json({ error: 'Course is not available for enrollment' });
      return;
    }
    const existing = await callProcedure<{ cnt: number }>('sp_check_enrollment_exists', [rollNo, courseId]);
    if ((existing[0]?.cnt ?? 0) > 0) {
      res.status(409).json({ error: 'Already enrolled in this course' });
      return;
    }
    const allotted = await callProcedure<CountRow>('sp_get_course_allotted_count', [courseId]);
    const allottedCount = allotted[0]?.cnt ?? 0;
    if (allottedCount >= course.Capacity) {
      res.status(400).json({ error: 'Course is full' });
      return;
    }
    await callProcedure('sp_insert_enrollment', [rollNo, courseId, 'allotted']);
    res.status(201).json({ message: 'Enrolled successfully', course_id: courseId });
  } catch (err) {
    console.error('Enroll error:', err);
    res.status(500).json({ error: 'Failed to enroll' });
  }
});

// DELETE /enrollments/:courseId – drop a course
router.delete('/:courseId', authMiddleware, requireStudent, async (req: Request, res: Response): Promise<void> => {
  try {
    const locals = (res as Response & { locals: AuthLocals }).locals;
    const rollNo = locals.user.sub;
    const courseId = String(req.params.courseId).trim();
    if (!courseId) {
      res.status(400).json({ error: 'Course ID required' });
      return;
    }
    const result = await callProcedure<{ affected_rows: number }>('sp_delete_enrollment', [rollNo, courseId]);
    if ((result[0]?.affected_rows ?? 0) === 0) {
      res.status(404).json({ error: 'Enrollment not found' });
      return;
    }
    res.json({ message: 'Enrollment removed', course_id: courseId });
  } catch (err) {
    console.error('Delete enrollment error:', err);
    res.status(500).json({ error: 'Failed to drop course' });
  }
});

export default router;
