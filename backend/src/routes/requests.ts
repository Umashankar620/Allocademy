import { Router, Request, Response } from 'express';
import { callProcedure } from '../config/db.js';
import { authMiddleware, requireStudent, requireAdmin, type AuthLocals } from '../middleware/auth.js';

const router = Router();

interface CourseRequestRow {
  Request_ID: number;
  STUDENT_Roll_No: string;
  student_name: string;
  student_email: string;
  COURSE_Course_ID: string;
  Course_Name: string;
  Credits: number;
  Faculty: string;
  Slot: string;
  Request_Date: string;
  Status: 'pending' | 'approved' | 'rejected';
}

interface AvailableCourseRow {
  Course_ID: string;
  Course_Name: string;
  Credits: number;
  Faculty: string;
  Slot: string;
  Capacity: number;
  Course_Type: string;
  allotted_count: number;
}

// STUDENT: GET /requests – get student's own requests
router.get('/', authMiddleware, requireStudent, async (_req: Request, res: Response): Promise<void> => {
  try {
    const locals = (res as Response & { locals: AuthLocals }).locals;
    const rollNo = locals.user.sub;

    const requests = await callProcedure<CourseRequestRow>(
      `SELECT 
        cr.Request_ID,
        cr.STUDENT_Roll_No,
        s.Name as student_name,
        s.Email as student_email,
        cr.COURSE_Course_ID,
        c.Course_Name,
        c.Credits,
        c.Faculty,
        c.Slot,
        cr.Request_Date,
        cr.Status
      FROM COURSE_REQUEST cr
      JOIN STUDENT s ON cr.STUDENT_Roll_No = s.Roll_No
      JOIN COURSE c ON cr.COURSE_Course_ID = c.Course_ID
      WHERE cr.STUDENT_Roll_No = ?
      ORDER BY cr.Request_Date DESC`,
      [rollNo]
    );

    res.json({
      requests: requests.map((r) => ({
        request_id: r.Request_ID,
        course_id: r.COURSE_Course_ID,
        course_name: r.Course_Name,
        credits: r.Credits,
        faculty: r.Faculty,
        slot: r.Slot,
        status: r.Status,
        request_date: r.Request_Date,
      })),
    });
  } catch (err) {
    console.error('Get requests error:', err);
    res.status(500).json({ error: 'Failed to fetch requests' });
  }
});

// STUDENT: POST /requests/:courseId – submit course request
router.post('/:courseId', authMiddleware, requireStudent, async (req: Request, res: Response): Promise<void> => {
  try {
    const locals = (res as Response & { locals: AuthLocals }).locals;
    const rollNo = locals.user.sub;
    const courseId = String(req.params.courseId).trim();

    if (!courseId) {
      res.status(400).json({ error: 'Course ID required' });
      return;
    }

    // Verify course exists
    const course = await callProcedure<{ Course_ID: string }>(
      'sp_get_course_id_by_id',
      [courseId]
    );

    if (course.length === 0) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Submit request
    await callProcedure('sp_submit_course_request', [rollNo, courseId]);

    res.status(201).json({ message: 'Course request submitted successfully', course_id: courseId });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to submit request';
    if (errorMsg.includes('already exists') || errorMsg.includes('already enrolled')) {
      res.status(409).json({ error: 'Request or enrollment already exists for this course' });
    } else {
      console.error('Submit request error:', err);
      res.status(500).json({ error: errorMsg });
    }
  }
});

// STUDENT: GET /requests/available/list – get available courses for request
router.get('/available/list', authMiddleware, requireStudent, async (_req: Request, res: Response): Promise<void> => {
  try {
    const locals = (res as Response & { locals: AuthLocals }).locals;
    const rollNo = locals.user.sub;

    const courses = await callProcedure<AvailableCourseRow>(
      'sp_get_available_courses_for_request',
      [rollNo]
    );

    res.json({
      courses: courses.map((c) => ({
        course_id: c.Course_ID,
        course_name: c.Course_Name,
        credits: c.Credits,
        faculty: c.Faculty,
        slot: c.Slot,
        capacity: c.Capacity,
        allotted_count: c.allotted_count,
        available_seats: c.Capacity - c.allotted_count,
        course_type: c.Course_Type,
      })),
    });
  } catch (err) {
    console.error('Get available courses error:', err);
    res.status(500).json({ error: 'Failed to fetch available courses' });
  }
});

// ADMIN: GET /requests/pending – get all pending requests
router.get('/pending', authMiddleware, requireAdmin, async (_req: Request, res: Response): Promise<void> => {
  try {
    const requests = await callProcedure<CourseRequestRow>('sp_get_pending_requests');

    res.json({
      requests: requests.map((r) => ({
        request_id: r.Request_ID,
        roll_no: r.STUDENT_Roll_No,
        student_name: r.student_name,
        student_email: r.student_email,
        course_id: r.COURSE_Course_ID,
        course_name: r.Course_Name,
        credits: r.Credits,
        faculty: r.Faculty,
        slot: r.Slot,
        request_date: r.Request_Date,
        status: r.Status,
      })),
    });
  } catch (err) {
    console.error('Get pending requests error:', err);
    res.status(500).json({ error: 'Failed to fetch pending requests' });
  }
});

// ADMIN: POST /requests/:requestId/approve – approve a request
router.post('/:requestId/approve', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const locals = (res as Response & { locals: AuthLocals }).locals;
    const adminId = parseInt(locals.user.sub, 10);
    const requestId = parseInt(req.params.requestId, 10);

    if (isNaN(requestId)) {
      res.status(400).json({ error: 'Invalid request ID' });
      return;
    }

    await callProcedure('sp_approve_course_request', [requestId, adminId]);

    res.json({ message: 'Course request approved', request_id: requestId });
  } catch (err) {
    const errorMsg = err instanceof Error ? err.message : 'Failed to approve request';
    if (errorMsg.includes('already enrolled')) {
      res.status(409).json({ error: 'Student is already enrolled in this course' });
    } else {
      console.error('Approve request error:', err);
      res.status(500).json({ error: errorMsg });
    }
  }
});

// ADMIN: POST /requests/:requestId/reject – reject a request
router.post('/:requestId/reject', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const locals = (res as Response & { locals: AuthLocals }).locals;
    const adminId = parseInt(locals.user.sub, 10);
    const requestId = parseInt(req.params.requestId, 10);
    const { reason } = req.body;

    if (isNaN(requestId)) {
      res.status(400).json({ error: 'Invalid request ID' });
      return;
    }

    await callProcedure('sp_reject_course_request', [requestId, adminId, reason || 'No reason provided']);

    res.json({ message: 'Course request rejected', request_id: requestId });
  } catch (err) {
    console.error('Reject request error:', err);
    res.status(500).json({ error: 'Failed to reject request' });
  }
});

// ADMIN: POST /requests/allot-compulsory/:courseId – allot compulsory course to all eligible students
router.post('/allot-compulsory/:courseId', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const locals = (res as Response & { locals: AuthLocals }).locals;
    const adminId = parseInt(locals.user.sub, 10);
    const courseId = String(req.params.courseId).trim();

    if (!courseId) {
      res.status(400).json({ error: 'Course ID required' });
      return;
    }

    // Verify course exists
    const course = await callProcedure<{ Course_ID: string }>(
      'sp_get_course_id_by_id',
      [courseId]
    );

    if (course.length === 0) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    await callProcedure('sp_allot_compulsory_course', [courseId, adminId]);

    res.json({ message: 'Compulsory course allotted to eligible students', course_id: courseId });
  } catch (err) {
    console.error('Allot compulsory course error:', err);
    res.status(500).json({ error: 'Failed to allot compulsory course' });
  }
});

export default router;
