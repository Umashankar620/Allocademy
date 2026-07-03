import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { BookOpen, Calendar, GraduationCap, X } from 'lucide-react';

type EnrolledCourse = {
  course_id: string;
  course_name: string;
  credits: number;
  department_name: string | null;
  semester: number | null;
  enrollment_date: string;
  status: string;
};

export function MyEnrollments() {
  const { accessToken } = useAuth();
  const [enrollments, setEnrollments] = useState<EnrolledCourse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [unenrollingId, setUnenrollingId] = useState<string | null>(null);

  useEffect(() => {
    if (!accessToken) return;
    setLoading(true);
    api<{ enrollments: EnrolledCourse[] }>('/enrollments', { token: accessToken })
      .then((data) => setEnrollments(data.enrollments))
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load enrollments'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  const handleUnenroll = async (courseId: string) => {
    if (!accessToken) return;
    const confirmed = window.confirm(`Are you sure you want to unenroll from ${courseId}?`);
    if (!confirmed) return;

    setUnenrollingId(courseId);
    setError('');
    try {
      await api(`/enrollments/${courseId}`, {
        method: 'DELETE',
        token: accessToken,
      });
      setEnrollments(enrollments.filter((e) => e.course_id !== courseId));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to unenroll');
    } finally {
      setUnenrollingId(null);
    }
  };

  const totalCredits = enrollments.reduce((sum, e) => sum + e.credits, 0);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">My Enrollments</h1>
        <p className="text-muted-foreground">Loading enrollments...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">My Enrollments</h1>
          <p className="text-muted-foreground mt-1">View and manage your enrolled courses</p>
        </div>
      </div>

      {error && <p className="text-sm text-destructive bg-red-50 p-3 rounded-md">{error}</p>}

      {/* Summary Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Courses</p>
                <p className="text-3xl font-bold text-blue-700">{enrollments.length}</p>
              </div>
              <BookOpen className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Credits</p>
                <p className="text-3xl font-bold text-green-700">{totalCredits}</p>
              </div>
              <GraduationCap className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Enrollments</p>
                <p className="text-3xl font-bold text-purple-700">
                  {enrollments.filter((e) => e.status === 'active').length}
                </p>
              </div>
              <Calendar className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enrolled Courses List */}
      {enrollments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">No enrollments yet</p>
            <p className="text-sm text-muted-foreground mt-2">
              Browse available courses and enroll to get started
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {enrollments.map((enrollment) => (
            <Card key={enrollment.course_id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-lg font-bold text-indigo-600">
                      {enrollment.course_id}
                    </CardTitle>
                    <p className="text-sm font-medium mt-1">{enrollment.course_name}</p>
                  </div>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleUnenroll(enrollment.course_id)}
                    disabled={unenrollingId === enrollment.course_id}
                    className="text-destructive hover:text-destructive"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Credits</span>
                  <span className="font-semibold">{enrollment.credits}</span>
                </div>
                {enrollment.department_name && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Department</span>
                    <span className="font-medium">{enrollment.department_name}</span>
                  </div>
                )}
                {enrollment.semester && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Semester</span>
                    <span className="font-medium">Sem {enrollment.semester}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm pt-2 border-t">
                  <span className="text-muted-foreground">Enrolled on</span>
                  <span className="text-xs text-muted-foreground">
                    {new Date(enrollment.enrollment_date).toLocaleDateString()}
                  </span>
                </div>
                <div className="pt-2">
                  <span
                    className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                      enrollment.status === 'active'
                        ? 'bg-green-100 text-green-700'
                        : 'bg-gray-100 text-gray-700'
                    }`}
                  >
                    {enrollment.status === 'active' ? 'Active' : enrollment.status}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
