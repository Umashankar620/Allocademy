import { Router, Request, Response } from 'express';
import { callProcedure } from '../config/db.js';
import { authMiddleware, requireStudent, type AuthLocals } from '../middleware/auth.js';
import { isAllotmentPublished } from '../config/constants.js';

const router = Router();

interface EnrollmentRow {
  COURSE_Course_ID: string;
  Status: 'allotted' | 'waitlisted';
  Enrollment_Date: string;
  Course_Name: string;
  Credits: number;
  Faculty: string;
  Slot: string;
  Capacity: number;
  Course_Type?: string;
  Elective_Slot?: string | null;
  Max_Choices?: number | null;
}

interface PrefRow {
  COURSE_Course_ID: string;
  Rank: number;
}

// GET /allotments/me – current student's allotment results with rank info
router.get('/me', authMiddleware, requireStudent, async (_req: Request, res: Response): Promise<void> => {
  try {
    const locals = (res as Response & { locals: AuthLocals }).locals;
    const rollNo = locals.user.sub;

    // Get enrollments (allotted + waitlisted)
    const enrollments = await callProcedure<EnrollmentRow>('sp_get_enrollments_by_student', [rollNo]);

    // Get original preferences for rank info
    const preferences = await callProcedure<PrefRow>('sp_get_preferences_by_student', [rollNo]);

    const prefRankMap = new Map(preferences.map((p) => [p.COURSE_Course_ID, p.Rank]));

    const allotted = enrollments
      .filter((e) => e.Status === 'allotted')
      .map((e) => ({
        course_id: e.COURSE_Course_ID,
        course_name: e.Course_Name,
        credits: e.Credits,
        status: 'allotted' as const,
        rank: prefRankMap.get(e.COURSE_Course_ID) ?? 0,
        enrollment_date: e.Enrollment_Date,
        faculty: e.Faculty,
        slot: e.Slot,
        preference_rank: prefRankMap.get(e.COURSE_Course_ID) ?? null,
        capacity: e.Capacity,
        course_type: e.Course_Type ?? 'core',
        elective_slot: e.Elective_Slot ?? null,
        max_choices: e.Max_Choices ?? null,
      }));

    const waitlisted = enrollments
      .filter((e) => e.Status === 'waitlisted')
      .map((e) => ({
        course_id: e.COURSE_Course_ID,
        course_name: e.Course_Name,
        credits: e.Credits,
        status: 'waitlisted' as const,
        rank: prefRankMap.get(e.COURSE_Course_ID) ?? 0,
        enrollment_date: e.Enrollment_Date,
        faculty: e.Faculty,
        slot: e.Slot,
        preference_rank: prefRankMap.get(e.COURSE_Course_ID) ?? null,
        capacity: e.Capacity,
        course_type: e.Course_Type ?? 'core',
        elective_slot: e.Elective_Slot ?? null,
        max_choices: e.Max_Choices ?? null,
      }));

    res.json({
      allotted,
      waitlisted,
      published: isAllotmentPublished(),
      summary: {
        total_allotted: allotted.length,
        total_credits: allotted.reduce((sum, a) => sum + (a.credits ?? 0), 0),
        total_waitlisted: waitlisted.length,
      },
    });
  } catch (err) {
    console.error('Get allotments error:', err);
    res.status(500).json({ error: 'Failed to fetch allotments' });
  }
});

// GET /result – same as /me but at /allotment/result for frontend (returns allotted, waitlisted, published)
router.get('/result', authMiddleware, requireStudent, async (_req: Request, res: Response): Promise<void> => {
  try {
    const locals = (res as Response & { locals: AuthLocals }).locals;
    const rollNo = locals.user.sub;
    const enrollments = await callProcedure<EnrollmentRow>('sp_get_enrollments_by_student', [rollNo]);
    const preferences = await callProcedure<PrefRow>('sp_get_preferences_by_student', [rollNo]);
    const prefRankMap = new Map(preferences.map((p) => [p.COURSE_Course_ID, p.Rank]));

    const allotted = enrollments
      .filter((e) => e.Status === 'allotted')
      .map((e) => ({
        course_id: e.COURSE_Course_ID,
        course_name: e.Course_Name,
        credits: e.Credits,
        status: 'allotted' as const,
        rank: prefRankMap.get(e.COURSE_Course_ID) ?? 0,
        enrollment_date: e.Enrollment_Date,
      }));

    const waitlisted = enrollments
      .filter((e) => e.Status === 'waitlisted')
      .map((e) => ({
        course_id: e.COURSE_Course_ID,
        course_name: e.Course_Name,
        credits: e.Credits,
        status: 'waitlisted' as const,
        rank: prefRankMap.get(e.COURSE_Course_ID) ?? 0,
        enrollment_date: e.Enrollment_Date,
      }));

    res.json({
      allotted,
      waitlisted,
      published: isAllotmentPublished(),
    });
  } catch (err) {
    console.error('Get allotment result error:', err);
    res.status(500).json({ error: 'Failed to fetch result' });
  }
});

export default router;
