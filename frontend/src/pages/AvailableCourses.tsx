import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';
import { CheckCircle2, Plus } from 'lucide-react';

type Course = {
  course_id: string;
  course_name: string;
  credits: number;
  department_name: string | null;
  semester: number | null;
  status: string;
  capacity: number;
  seats_available: number;
  seats_allotted: number;
  slot: string;
  faculty: string;
  course_type?: string;
  elective_slot?: string | null;
  max_choices?: number | null;
};

const DEPARTMENTS = ['CSE', 'ECE', 'EEE', 'MECH', 'CIVIL', 'Other'];
const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export function AvailableCourses() {
  const { accessToken } = useAuth();
  const [courses, setCourses] = useState<Course[]>([]);
  const [preferences, setPreferences] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState<string>('');
  const [search, setSearch] = useState('');
  const [addingId, setAddingId] = useState<string | null>(null);

  const loadPreferences = useCallback(async () => {
    if (!accessToken) return;
    try {
      const { preferences: prefs } = await api<{ preferences: { course_id: string; rank: number }[] }>('/preferences', { token: accessToken });
      setPreferences(prefs.map((p) => p.course_id));
    } catch {
      // Ignore errors, just show no preferences
    }
  }, [accessToken]);

  const addToPreferences = useCallback(
    async (courseId: string) => {
      if (!accessToken) return;
      setAddingId(courseId);
      setError('');
      setSuccess('');
      try {
        const { preferences: current } = await api<{ preferences: { course_id: string; rank: number }[] }>('/preferences', { token: accessToken });
        const exists = current.some((p) => p.course_id === courseId);
        if (exists) {
          setError('Already in your preferences');
          setAddingId(null);
          return;
        }
        const next = [...current, { course_id: courseId, rank: current.length + 1 }];
        await api('/preferences', {
          method: 'PUT',
          body: JSON.stringify({ preferences: next }),
          token: accessToken,
        });
        setSuccess(`Added ${courseId} to preferences`);
        await loadPreferences();
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to add');
      } finally {
        setAddingId(null);
      }
    },
    [accessToken, loadPreferences]
  );

  useEffect(() => {
    loadPreferences();
  }, [loadPreferences]);

  useEffect(() => {
    const params = new URLSearchParams();
    if (department) params.set('department', department);
    if (semester) params.set('semester', semester);
    const q = params.toString();
    api<{ courses: Course[] }>(`/courses${q ? `?${q}` : ''}`, { token: accessToken ?? undefined })
      .then((data) => setCourses(data.courses))
      .catch((err) => setError(err instanceof Error ? err.message : 'Failed to load courses'))
      .finally(() => setLoading(false));
  }, [accessToken, department, semester]);

  const filtered = search.trim()
    ? courses.filter(
        (c) =>
          c.course_id.toLowerCase().includes(search.toLowerCase()) ||
          c.course_name.toLowerCase().includes(search.toLowerCase()) ||
          (c.department_name ?? '').toLowerCase().includes(search.toLowerCase())
      )
    : courses;

  // Filter only active courses
  const activeCourses = filtered.filter((c) => c.status === 'active');

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">Available Courses</h1>
        <p className="text-muted-foreground mt-1">Browse courses and add them to your preferences</p>
      </div>
      <div className="flex flex-wrap gap-4 items-center">
        <Input
          placeholder="Search by code, name, department..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="max-w-xs"
        />
        <select
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
        >
          <option value="">All departments</option>
          {DEPARTMENTS.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          className="flex h-9 rounded-md border border-input bg-background px-3 py-1 text-sm"
          value={semester}
          onChange={(e) => setSemester(e.target.value)}
        >
          <option value="">All semesters</option>
          {SEMESTERS.map((s) => (
            <option key={s} value={String(s)}>Sem {s}</option>
          ))}
        </select>
      </div>
      {error && <p className="text-sm text-destructive">{error}</p>}
      {success && <p className="text-sm text-green-600">{success}</p>}
      {loading ? (
        <p className="text-muted-foreground">Loading courses...</p>
      ) : activeCourses.length === 0 ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            No active courses found matching your filters.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Active Courses ({activeCourses.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border bg-card">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="text-left p-3 font-medium">Course Code</th>
                      <th className="text-left p-3 font-medium">Course Name</th>
                      <th className="text-left p-3 font-medium">Department</th>
                      <th className="text-left p-3 font-medium">Semester</th>
                      <th className="text-left p-3 font-medium">Credits</th>
                      <th className="text-left p-3 font-medium w-32">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activeCourses.map((c) => {
                          const isAdded = preferences.includes(c.course_id);
                      const isAdding = addingId === c.course_id;

                      return (
                        <tr key={c.course_id} className="border-b last:border-0 hover:bg-muted/30">
                          <td className="p-3 font-medium text-indigo-600">{c.course_id}</td>
                          <td className="p-3">{c.course_name}</td>
                          <td className="p-3 text-muted-foreground">{c.department_name || '—'}</td>
                          <td className="p-3">{c.semester ? `Sem ${c.semester}` : '—'}</td>
                          <td className="p-3 font-medium">{c.credits}</td>
                          <td className="p-3">
                            <Button
                              size="sm"
                              variant={isAdded ? "secondary" : "default"}
                              disabled={isAdded || isAdding}
                                  onClick={() => addToPreferences(c.course_id)}
                                  className={cn(isAdded && "cursor-not-allowed")}
                                >
                                  {isAdding ? (
                                    'Adding…'
                                  ) : isAdded ? (
                                    <>
                                      <CheckCircle2 className="w-4 h-4 mr-1" />
                                      Added
                                    </>
                                  ) : (
                                    <>
                                      <Plus className="w-4 h-4 mr-1" />
                                      Add to Preferences
                                    </>
                                  )}
                            </Button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
