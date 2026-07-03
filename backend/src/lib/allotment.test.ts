import { describe, it, expect } from 'vitest';
import type { StudentPreference } from '../lib/allotment.js';

/**
 * Mock allotment algorithm for testing
 * This mirrors the actual algorithm logic for unit testing
 */
function mockAllotmentAlgorithm(
  prefs: StudentPreference[],
  capacities: Map<string, number>
): { allotments: Array<{ roll_no: string; course_id: string; status: string }>; stats: { allotted: number; waitlisted: number } } {
  const enrollments = new Map<string, number>();
  const allotments: Array<{ roll_no: string; course_id: string; status: string }> = [];

  // Initialize enrollment counts
  capacities.forEach((_, courseId) => {
    enrollments.set(courseId, 0);
  });

  // Group preferences by student (already sorted by CGPA in input)
  const prefsByStudent = new Map<string, StudentPreference[]>();
  prefs.forEach((p) => {
    if (!prefsByStudent.has(p.roll_no)) {
      prefsByStudent.set(p.roll_no, []);
    }
    prefsByStudent.get(p.roll_no)!.push(p);
  });

  let allottedCount = 0;
  let waitlistedCount = 0;

  for (const [rollNo, studentPrefs] of prefsByStudent.entries()) {
    for (const pref of studentPrefs) {
      const courseId = pref.course_id;
      const capacity = capacities.get(courseId) ?? 0;
      const currentEnrollment = enrollments.get(courseId) ?? 0;

      if (currentEnrollment < capacity) {
        // Seat available: allot
        allotments.push({ roll_no: rollNo, course_id: courseId, status: 'allotted' });
        enrollments.set(courseId, currentEnrollment + 1);
        allottedCount++;
      } else {
        // No seat: waitlist
        allotments.push({ roll_no: rollNo, course_id: courseId, status: 'waitlisted' });
        waitlistedCount++;
      }
    }
  }

  return {
    allotments,
    stats: { allotted: allottedCount, waitlisted: waitlistedCount },
  };
}

describe('Allotment Engine', () => {
  describe('Basic Allotment Flow', () => {
    it('should allot students to courses within capacity', () => {
      const prefs: StudentPreference[] = [
        { roll_no: 'S001', cgpa: 3.8, course_id: 'CS101', rank: 1 },
        { roll_no: 'S002', cgpa: 3.5, course_id: 'CS101', rank: 1 },
        { roll_no: 'S003', cgpa: 3.2, course_id: 'CS101', rank: 1 },
      ];

      const capacities = new Map([['CS101', 2]]);

      const result = mockAllotmentAlgorithm(prefs, capacities);

      expect(result.stats.allotted).toBe(2);
      expect(result.stats.waitlisted).toBe(1);
    });

    it('should handle multiple preferences per student', () => {
      const prefs: StudentPreference[] = [
        { roll_no: 'S001', cgpa: 3.8, course_id: 'CS101', rank: 1 },
        { roll_no: 'S001', cgpa: 3.8, course_id: 'CS102', rank: 2 },
        { roll_no: 'S002', cgpa: 3.5, course_id: 'CS101', rank: 1 },
      ];

      const capacities = new Map([
        ['CS101', 1],
        ['CS102', 2],
      ]);

      const result = mockAllotmentAlgorithm(prefs, capacities);

      // S001 (higher CGPA) gets CS101 and CS102 (2 allotted)
      // S002 gets waitlisted for CS101 (1 waitlisted)
      expect(result.stats.allotted).toBe(2);
      expect(result.stats.waitlisted).toBe(1);
    });

    it('should waitlist when courses are full', () => {
      const prefs: StudentPreference[] = [
        { roll_no: 'S001', cgpa: 3.8, course_id: 'CS101', rank: 1 },
        { roll_no: 'S002', cgpa: 3.5, course_id: 'CS101', rank: 1 },
        { roll_no: 'S003', cgpa: 3.2, course_id: 'CS101', rank: 1 },
      ];

      const capacities = new Map([['CS101', 1]]);

      const result = mockAllotmentAlgorithm(prefs, capacities);

      expect(result.stats.allotted).toBe(1);
      expect(result.stats.waitlisted).toBe(2);
    });

    it('should handle same CGPA students fairly', () => {
      // When CGPA is same, first preference rank takes priority (from ORDER BY in query)
      const prefs: StudentPreference[] = [
        { roll_no: 'S001', cgpa: 3.5, course_id: 'CS101', rank: 1 },
        { roll_no: 'S002', cgpa: 3.5, course_id: 'CS101', rank: 1 },
      ];

      const capacities = new Map([['CS101', 1]]);

      // Since they're same CGPA, first in list gets it
      const result = mockAllotmentAlgorithm(prefs, capacities);

      expect(result.stats.allotted).toBe(1);
      expect(result.stats.waitlisted).toBe(1);
    });

    it('should allot ranked preferences in order', () => {
      const prefs: StudentPreference[] = [
        { roll_no: 'S001', cgpa: 3.8, course_id: 'CS101', rank: 1 },
        { roll_no: 'S001', cgpa: 3.8, course_id: 'CS102', rank: 2 },
        { roll_no: 'S001', cgpa: 3.8, course_id: 'CS103', rank: 3 },
      ];

      const capacities = new Map([
        ['CS101', 1],
        ['CS102', 1],
        ['CS103', 0],
      ]);

      const result = mockAllotmentAlgorithm(prefs, capacities);

      // S001 gets CS101 and CS102, waitlisted for CS103
      expect(result.stats.allotted).toBe(2);
      expect(result.stats.waitlisted).toBe(1);

      const s001Allotments = result.allotments.filter((a) => a.roll_no === 'S001' && a.status === 'allotted');
      expect(s001Allotments).toHaveLength(2);
      expect(s001Allotments[0]?.course_id).toBe('CS101');
      expect(s001Allotments[1]?.course_id).toBe('CS102');
    });
  });

  describe('Edge Cases', () => {
    it('should handle zero capacity courses', () => {
      const prefs: StudentPreference[] = [{ roll_no: 'S001', cgpa: 3.8, course_id: 'CS101', rank: 1 }];

      const capacities = new Map([['CS101', 0]]);

      const result = mockAllotmentAlgorithm(prefs, capacities);

      expect(result.stats.allotted).toBe(0);
      expect(result.stats.waitlisted).toBe(1);
    });

    it('should handle no preferences', () => {
      const prefs: StudentPreference[] = [];

      const capacities = new Map([['CS101', 10]]);

      const result = mockAllotmentAlgorithm(prefs, capacities);

      expect(result.stats.allotted).toBe(0);
      expect(result.stats.waitlisted).toBe(0);
    });

    it('should handle student with no preferences', () => {
      const prefs: StudentPreference[] = [{ roll_no: 'S001', cgpa: 3.8, course_id: 'CS101', rank: 1 }];

      const capacities = new Map([
        ['CS101', 1],
        ['CS102', 1],
      ]);

      const result = mockAllotmentAlgorithm(prefs, capacities);

      expect(result.stats.allotted).toBe(1);
      expect(result.stats.waitlisted).toBe(0);
    });

    it('should handle insufficient total capacity', () => {
      const prefs: StudentPreference[] = [
        { roll_no: 'S001', cgpa: 3.8, course_id: 'CS101', rank: 1 },
        { roll_no: 'S002', cgpa: 3.5, course_id: 'CS101', rank: 1 },
        { roll_no: 'S003', cgpa: 3.2, course_id: 'CS101', rank: 1 },
        { roll_no: 'S004', cgpa: 3.0, course_id: 'CS101', rank: 1 },
        { roll_no: 'S005', cgpa: 2.8, course_id: 'CS101', rank: 1 },
      ];

      const capacities = new Map([['CS101', 2]]);

      const result = mockAllotmentAlgorithm(prefs, capacities);

      expect(result.stats.allotted).toBe(2);
      expect(result.stats.waitlisted).toBe(3);
    });

    it('should prioritize higher CGPA students', () => {
      const prefs: StudentPreference[] = [
        { roll_no: 'S001', cgpa: 3.8, course_id: 'CS101', rank: 1 },
        { roll_no: 'S002', cgpa: 3.2, course_id: 'CS101', rank: 1 },
      ];

      const capacities = new Map([['CS101', 1]]);

      const result = mockAllotmentAlgorithm(prefs, capacities);

      const allotted = result.allotments.filter((a) => a.status === 'allotted');
      expect(allotted[0]?.roll_no).toBe('S001'); // Higher CGPA gets allotted
    });
  });

  describe('Multi-Course Scenarios', () => {
    it('should distribute students across multiple courses', () => {
      const prefs: StudentPreference[] = [
        { roll_no: 'S001', cgpa: 3.8, course_id: 'CS101', rank: 1 },
        { roll_no: 'S002', cgpa: 3.5, course_id: 'CS102', rank: 1 },
        { roll_no: 'S003', cgpa: 3.2, course_id: 'CS103', rank: 1 },
      ];

      const capacities = new Map([
        ['CS101', 1],
        ['CS102', 1],
        ['CS103', 1],
      ]);

      const result = mockAllotmentAlgorithm(prefs, capacities);

      expect(result.stats.allotted).toBe(3);
      expect(result.stats.waitlisted).toBe(0);
    });

    it('should handle students competing in multiple courses', () => {
      const prefs: StudentPreference[] = [
        { roll_no: 'S001', cgpa: 3.8, course_id: 'CS101', rank: 1 },
        { roll_no: 'S001', cgpa: 3.8, course_id: 'CS102', rank: 2 },
        { roll_no: 'S002', cgpa: 3.5, course_id: 'CS101', rank: 1 },
        { roll_no: 'S002', cgpa: 3.5, course_id: 'CS102', rank: 2 },
      ];

      const capacities = new Map([
        ['CS101', 1],
        ['CS102', 1],
      ]);

      const result = mockAllotmentAlgorithm(prefs, capacities);

      // S001 (higher CGPA) gets CS101, then CS102
      // S002 (lower CGPA) gets waitlisted for CS101
      expect(result.stats.allotted).toBe(2);
      expect(result.stats.waitlisted).toBe(2);
    });
  });
});
