import { Router, Request, Response } from 'express';
import { callProcedure } from '../config/db.js';
import { authMiddleware, requireStudent, type AuthLocals } from '../middleware/auth.js';
import { PREFERENCE_DEADLINE, canSubmitPreferences } from '../config/constants.js';

const router = Router();

type PrefRow = { STUDENT_Roll_No: string; COURSE_Course_ID: string; Rank: number };
type CourseRow = { Course_ID: string; Course_Name: string; Credits: number; Faculty: string; Slot: string; Course_Type?: string; Elective_Slot?: string | null; Max_Choices?: number | null };

// GET /preferences – current student's preferences with course details and deadline info
router.get('/', authMiddleware, requireStudent, async (_req: Request, res: Response): Promise<void> => {
  try {
    const locals = (res as Response & { locals: AuthLocals }).locals;
    const rollNo = locals.user.sub;
    const prefs = await callProcedure<PrefRow>('sp_get_preferences_by_student', [rollNo]);
    const result = await Promise.all(
      prefs.map(async (p) => {
        const courses = await callProcedure<CourseRow>('sp_get_course_basic_by_id', [p.COURSE_Course_ID]);
        const c = courses[0];
        return {
          course_id: p.COURSE_Course_ID,
          rank: p.Rank,
          course_name: c?.Course_Name ?? null,
          credits: c?.Credits ?? null,
          faculty: c?.Faculty ?? null,
          slot: c?.Slot ?? null,
          course_type: c?.Course_Type ?? null,
          elective_slot: c?.Elective_Slot ?? null,
          max_choices: c?.Max_Choices ?? null,
        };
      })
    );
    res.json({
      preferences: result,
      deadline: PREFERENCE_DEADLINE,
      can_edit: canSubmitPreferences(),
    });
  } catch (err) {
    console.error('Get preferences error:', err);
    res.status(500).json({ error: 'Failed to get preferences' });
  }
});

// PUT /preferences – replace full preference list (array of { course_id, rank })
// Forbidden after deadline (if configured)
router.put('/', authMiddleware, requireStudent, async (req: Request, res: Response): Promise<void> => {
  try {
    // Check deadline first
    if (!canSubmitPreferences()) {
      res.status(403).json({ error: 'Preference submission deadline has passed' });
      return;
    }

    const locals = (res as Response & { locals: AuthLocals }).locals;
    const rollNo = locals.user.sub;
    const body = req.body as { preferences?: Array<{ course_id: string; rank: number }> };
    const list = Array.isArray(body.preferences) ? body.preferences : [];
    const seen = new Set<string>();
    for (const p of list) {
      const id = String(p.course_id).trim();
      if (!id || typeof p.rank !== 'number' || p.rank < 1) {
        res.status(400).json({ error: 'Each preference must have course_id and rank (positive number)' });
        return;
      }
      if (seen.has(id)) {
        res.status(400).json({ error: 'Duplicate course in preferences' });
        return;
      }
      seen.add(id);
    }
    const courseIds = list.map((p) => String(p.course_id).trim());
    if (courseIds.length > 0) {
      const existing = await callProcedure<{ Course_ID: string }>('sp_get_courses_by_ids_json', [courseIds.join(',')]);
      const validIds = new Set((existing as { Course_ID: string }[]).map((r) => r.Course_ID));
      for (const id of courseIds) {
        if (!validIds.has(id)) {
          res.status(400).json({ error: `Invalid course_id: ${id}` });
          return;
        }
      }
    }
    await callProcedure('sp_delete_preferences_by_student', [rollNo]);
    for (let i = 0; i < list.length; i++) {
      await callProcedure('sp_insert_preference', [rollNo, list[i].course_id.trim(), list[i].rank]);
    }
    res.json({ message: 'Preferences updated', count: list.length });
  } catch (err) {
    console.error('Put preferences error:', err);
    res.status(500).json({ error: 'Failed to update preferences' });
  }
});

export default router;
