import { callProcedure } from '../config/db.js';

export interface StudentPreference {
  roll_no: string;
  cgpa: number | null;
  course_id: string;
  rank: number;
  course_type?: string | null;
  elective_slot?: string | null;
}

export interface AllotmentResult {
  student_count: number;
  allotted_count: number;
  waitlisted_count: number;
  timestamp: string;
}

/**
 * Load all preferences with student CGPA details and course type/slot info
 */
async function loadPreferencesWithCGPA(): Promise<StudentPreference[]> {
  return callProcedure<StudentPreference>('sp_load_preferences_with_cgpa');
}

/**
 * Get current enrollment counts per course
 * (Reserved for future use - e.g., checking counts before allotment)
 */
// async function getEnrollmentCounts(): Promise<Map<string, number>> {
//   const rows = await query<{ course_id: string; count: string }[]>(`
//     SELECT COURSE_Course_ID as course_id, COUNT(*) as count
//     FROM ENROLLMENT
//     WHERE Status = 'allotted'
//     GROUP BY COURSE_Course_ID
//   `);
//
//   const counts = new Map<string, number>();
//   rows.forEach((r) => {
//     counts.set(r.course_id, parseInt(r.count, 10));
//   });
//   return counts;
// }

/**
 * Get course capacities
 */
async function getCoursesCapacity(): Promise<Map<string, number>> {
  const courses = await callProcedure<{ course_id: string; capacity: number }>('sp_get_course_capacities');

  const capacities = new Map<string, number>();
  courses.forEach((c) => {
    capacities.set(c.course_id, c.capacity);
  });
  return capacities;
}

/**
 * Clear existing enrollments
 */
async function clearEnrollments(): Promise<void> {
  await callProcedure('sp_clear_enrollments');
}

/**
 * Insert enrollment record
 */
async function insertEnrollment(
  rollNo: string,
  courseId: string,
  status: 'allotted' | 'waitlisted'
): Promise<void> {
  await callProcedure('sp_insert_enrollment', [rollNo, courseId, status]);
}

/**
 * Main allotment algorithm
 * - Sort students by CGPA (descending)
 * - For each student: try to allot courses in preference rank order
 * - For elective courses: ensure only 1 course per elective slot per student
 * - If course has capacity, allot; else waitlist
 * - Returns summary statistics
 */
export async function runAllotment(): Promise<AllotmentResult> {
  const prefs = await loadPreferencesWithCGPA();
  const capacities = await getCoursesCapacity();
  const enrollments = new Map<string, number>();

  // Initialize enrollment counts
  capacities.forEach((_, courseId) => {
    enrollments.set(courseId, 0);
  });

  // Clear existing enrollments
  await clearEnrollments();

  // Group preferences by student
  const prefsByStudent = new Map<string, StudentPreference[]>();
  prefs.forEach((p) => {
    if (!prefsByStudent.has(p.roll_no)) {
      prefsByStudent.set(p.roll_no, []);
    }
    prefsByStudent.get(p.roll_no)!.push(p);
  });

  // Sort students by CGPA descending (already sorted from DB query)
  // Process each student's preferences
  let allottedCount = 0;
  let waitlistedCount = 0;

  for (const [rollNo, studentPrefs] of prefsByStudent.entries()) {
    // Track which elective slots this student has been allotted from
    const allottedSlots = new Set<string>();
    
    // Track which student got what status
    const studentEnrollments: Array<{ courseId: string; status: 'allotted' | 'waitlisted' }> = [];

    for (const pref of studentPrefs) {
      const courseId = pref.course_id;
      const courseType = pref.course_type ?? 'core';
      const electiveSlot = pref.elective_slot ?? null;
      
      // For elective courses: check if student already has an allotment from this slot
      if (courseType === 'elective' && electiveSlot) {
        if (allottedSlots.has(electiveSlot)) {
          // Student already allotted from this slot, skip this preference
          continue;
        }
      }

      const capacity = capacities.get(courseId) ?? 0;
      const currentEnrollment = enrollments.get(courseId) ?? 0;

      if (currentEnrollment < capacity) {
        // Seat available: allot
        studentEnrollments.push({ courseId, status: 'allotted' });
        enrollments.set(courseId, currentEnrollment + 1);
        allottedCount++;
        
        // If elective, mark this slot as used
        if (courseType === 'elective' && electiveSlot) {
          allottedSlots.add(electiveSlot);
        }
      } else {
        // No seat: waitlist
        studentEnrollments.push({ courseId, status: 'waitlisted' });
        waitlistedCount++;
        
        // If elective, mark this slot as used (even if waitlisted, don't consider other courses from same slot)
        if (courseType === 'elective' && electiveSlot) {
          allottedSlots.add(electiveSlot);
        }
      }
    }

    // Batch insert enrollments for this student
    for (const enrollment of studentEnrollments) {
      await insertEnrollment(rollNo, enrollment.courseId, enrollment.status);
    }
  }

  return {
    student_count: prefsByStudent.size,
    allotted_count: allottedCount,
    waitlisted_count: waitlistedCount,
    timestamp: new Date().toISOString(),
  };
}
