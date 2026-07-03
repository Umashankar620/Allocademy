import { Router, Request, Response } from 'express';
import { callProcedure } from '../config/db.js';
import { authMiddleware, requireAdmin } from '../middleware/auth.js';

const router = Router();

type CourseRow = {
  Course_ID: string;
  Course_Name: string;
  Credits: number;
  Department_ID: number | null;
  Semester: number | null;
  Status: string;
  Capacity: number;
  Slot: string;
  Faculty: string;
  Course_Type: string;
  Elective_Slot: string | null;
  Max_Choices: number | null;
};
type DeptRow = { Department_Name: string };
type CountRow = { cnt: number };

async function getSeatsAllotted(courseId: string): Promise<number> {
  const rows = await callProcedure<CountRow>('sp_get_course_allotted_count', [courseId]);
  return rows[0]?.cnt ?? 0;
}

function mapCourse(row: CourseRow, seatsAllotted: number, departmentName?: string | null) {
  const seatsAvailable = Math.max(0, row.Capacity - seatsAllotted);
  return {
    course_id: row.Course_ID,
    course_name: row.Course_Name,
    credits: row.Credits,
    department_id: row.Department_ID,
    department_name: departmentName ?? null,
    semester: row.Semester,
    status: row.Status,
    capacity: row.Capacity,
    seats_available: seatsAvailable,
    seats_allotted: seatsAllotted,
    slot: row.Slot,
    faculty: row.Faculty,
    course_type: row.Course_Type,
    elective_slot: row.Elective_Slot,
    max_choices: row.Max_Choices,
  };
}

// GET /courses – list courses (filters by student's semester/dept if authenticated)
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const dept = req.query.department as string | undefined;
    const sem = req.query.semester as string | undefined;
    let studentRollNo: string | null = null;
    
    // If authenticated, filter by student's semester and department
    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      try {
        const { verifyAccessToken } = await import('../lib/auth.js');
        const decoded = verifyAccessToken(token);
        if (decoded.role === 'student' && decoded.sub) {
          studentRollNo = decoded.sub;
        }
      } catch {
        // Invalid token, proceed without filtering
      }
    }
    
    // Admin can still use manual filters
    const deptName = dept ?? null;
    const semester = sem !== undefined && sem !== '' ? Number(sem) : null;

    const rows = await callProcedure<CourseRow>('sp_list_courses', [
      'active',
      deptName,
      semester,
      studentRollNo,
    ]);
    const result = await Promise.all(
      rows.map(async (r) => {
        const allotted = await getSeatsAllotted(r.Course_ID);
        let departmentName: string | null = null;
        if (r.Department_ID) {
          const d = await callProcedure<DeptRow>('sp_get_department_name_by_id', [r.Department_ID]);
          if (d.length > 0) departmentName = d[0].Department_Name;
        }
        return mapCourse(r, allotted, departmentName);
      })
    );
    res.json({ courses: result });
  } catch (err) {
    console.error('List courses error:', err);
    res.status(500).json({ error: 'Failed to list courses' });
  }
});

// GET /courses/:courseId – single course with seat availability
router.get('/:courseId', async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const rows = await callProcedure<CourseRow>('sp_get_course_by_id', [courseId]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    const r = rows[0];
    const allotted = await getSeatsAllotted(r.Course_ID);
    let departmentName: string | null = null;
    if (r.Department_ID) {
      const d = await callProcedure<DeptRow>('sp_get_department_name_by_id', [r.Department_ID]);
      if (d.length > 0) departmentName = d[0].Department_Name;
    }
    res.json(mapCourse(r, allotted, departmentName));
  } catch (err) {
    console.error('Get course error:', err);
    res.status(500).json({ error: 'Failed to get course' });
  }
});

// POST /courses – add course (admin only)
router.post('/', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { course_id, course_name, credits, department_id, semester, capacity, slot, faculty, course_type, elective_slot, max_choices } = req.body as Record<string, unknown>;
    if (!course_id || !course_name || typeof credits !== 'number' || capacity == null) {
      res.status(400).json({ error: 'Required: course_id, course_name, credits, capacity' });
      return;
    }
    const id = String(course_id).trim();
    const existing = await callProcedure<{ Course_ID: string }>('sp_get_course_id_by_id', [id]);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Course ID already exists' });
      return;
    }
    
    const courseType = course_type === 'elective' ? 'elective' : 'core';
    const electiveSlot = courseType === 'elective' && elective_slot ? String(elective_slot) : null;
    const maxChoices = courseType === 'elective' && max_choices != null ? Number(max_choices) : null;
    
    await callProcedure('sp_create_course', [
      id,
      String(course_name),
      Number(credits),
      department_id != null ? Number(department_id) : null,
      semester != null ? Number(semester) : null,
      Number(capacity),
      slot != null ? String(slot) : 'TBA',
      faculty != null ? String(faculty) : 'TBA',
      courseType,
      electiveSlot,
      maxChoices,
    ]);
    res.status(201).json({ message: 'Course created', course_id: id });
  } catch (err) {
    console.error('Create course error:', err);
    res.status(500).json({ error: 'Failed to create course' });
  }
});

// PATCH /courses/:courseId – edit course (admin only)
router.patch('/:courseId', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const { course_name, credits, department_id, semester, capacity, slot, faculty, status, course_type, elective_slot, max_choices } = req.body as Record<string, unknown>;
    const rows = await callProcedure<CourseRow>('sp_get_course_id_by_id', [courseId]);
    if (rows.length === 0) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    const setCourseName = course_name !== undefined;
    const setCredits = credits !== undefined;
    const setDepartmentId = department_id !== undefined;
    const setSemester = semester !== undefined;
    const setCapacity = capacity !== undefined;
    const setSlot = slot !== undefined;
    const setFaculty = faculty !== undefined;
    const setStatus = status !== undefined && ['active', 'inactive', 'archived'].includes(String(status));
    const setCourseType = course_type !== undefined && ['core', 'elective'].includes(String(course_type));
    const setElectiveSlot = elective_slot !== undefined;
    const setMaxChoices = max_choices !== undefined;

    if (
      !setCourseName &&
      !setCredits &&
      !setDepartmentId &&
      !setSemester &&
      !setCapacity &&
      !setSlot &&
      !setFaculty &&
      !setStatus &&
      !setCourseType &&
      !setElectiveSlot &&
      !setMaxChoices
    ) {
      res.status(400).json({ error: 'No fields to update' });
      return;
    }

    await callProcedure('sp_update_course', [
      courseId,
      setCourseName ? course_name : null,
      setCourseName ? 1 : 0,
      setCredits ? Number(credits) : null,
      setCredits ? 1 : 0,
      setDepartmentId ? (department_id == null ? null : Number(department_id)) : null,
      setDepartmentId ? 1 : 0,
      setSemester ? (semester == null ? null : Number(semester)) : null,
      setSemester ? 1 : 0,
      setCapacity ? Number(capacity) : null,
      setCapacity ? 1 : 0,
      setSlot ? slot : null,
      setSlot ? 1 : 0,
      setFaculty ? faculty : null,
      setFaculty ? 1 : 0,
      setStatus ? status : null,
      setStatus ? 1 : 0,
      setCourseType ? course_type : null,
      setCourseType ? 1 : 0,
      setElectiveSlot ? (elective_slot || null) : null,
      setElectiveSlot ? 1 : 0,
      setMaxChoices ? (max_choices != null ? Number(max_choices) : null) : null,
      setMaxChoices ? 1 : 0,
    ]);
    res.json({ message: 'Course updated' });
  } catch (err) {
    console.error('Update course error:', err);
    res.status(500).json({ error: 'Failed to update course' });
  }
});

// GET /courses/:courseId/students – get students enrolled in a specific course (admin only)
router.get('/:courseId/students', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    
    // Verify course exists
    const courses = await callProcedure<CourseRow>('sp_get_course_id_by_id', [courseId]);
    if (courses.length === 0) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }

    // Get enrolled students with their enrollment status
    const students = await callProcedure<{
      roll_no: string;
      name: string;
      email: string;
      cgpa: number | null;
      status: string;
      enrollment_status: string;
      enrollment_date: string;
    }>('sp_get_course_students', [courseId]);

    res.json({
      course_id: courseId,
      total_enrolled: students.length,
      allotted: students.filter(s => s.enrollment_status === 'allotted').length,
      waitlisted: students.filter(s => s.enrollment_status === 'waitlisted').length,
      students: students.map(s => ({
        roll_no: s.roll_no,
        name: s.name,
        email: s.email,
        cgpa: s.cgpa,
        status: s.status,
        enrollment_status: s.enrollment_status,
        enrollment_date: s.enrollment_date,
      })),
    });
  } catch (err) {
    console.error('Get course students error:', err);
    res.status(500).json({ error: 'Failed to fetch course students' });
  }
});

// DELETE /courses/:courseId – delete course (admin only; FK cascade will clean ENROLLMENT, PREFERENCE, ADM_IN_ACCESS)
router.delete('/:courseId', authMiddleware, requireAdmin, async (req: Request, res: Response): Promise<void> => {
  try {
    const { courseId } = req.params;
    const result = await callProcedure<{ affected_rows: number }>('sp_delete_course', [courseId]);
    if ((result[0]?.affected_rows ?? 0) === 0) {
      res.status(404).json({ error: 'Course not found' });
      return;
    }
    res.json({ message: 'Course deleted' });
  } catch (err) {
    console.error('Delete course error:', err);
    res.status(500).json({ error: 'Failed to delete course' });
  }
});

export default router;
