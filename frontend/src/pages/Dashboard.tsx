import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BookOpen, GraduationCap, User, CheckCircle2, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function Dashboard() {
  const { user, role, accessToken } = useAuth();
  const [preferenceCount, setPreferenceCount] = useState(0);
  const [enrollmentCount, setEnrollmentCount] = useState(0);
  const [totalCredits, setTotalCredits] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (role === 'admin' || !accessToken) {
      setLoading(false);
      return;
    }
    // Load preferences
    api<{ preferences: Array<{ course_id: string }> }>('/preferences', { token: accessToken })
      .then((data) => {
        setPreferenceCount(data.preferences.length);
      })
      .catch(() => {
        // Ignore errors
      });
    
    // Load enrollments
    api<{ enrollments: Array<{ credits: number }> }>('/enrollments', { token: accessToken })
      .then((data) => {
        setEnrollmentCount(data.enrollments.length);
        setTotalCredits(data.enrollments.reduce((sum, e) => sum + e.credits, 0));
      })
      .catch(() => {
        // Ignore errors
      })
      .finally(() => setLoading(false));
  }, [accessToken, role]);

  if (role === 'admin') {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Welcome back, {user?.name || user?.email}</p>
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200">
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Quick Actions</p>
                  <p className="text-lg font-semibold text-indigo-700 mt-1">Manage System</p>
                </div>
                <User className="h-8 w-8 text-indigo-600" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const approvalStatus = user?.status === 'active' ? 'approved' : 'pending';

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Welcome back, {user?.name || 'Student'}!</h1>
        <p className="text-muted-foreground mt-1">Manage your course enrollments</p>
      </div>

      {/* Approval Status Banner */}
      {approvalStatus === 'pending' && (
        <Card className="bg-yellow-50 border-yellow-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <Clock className="h-5 w-5 text-yellow-600" />
              <div className="flex-1">
                <p className="font-medium text-yellow-900">Account Pending Approval</p>
                <p className="text-sm text-yellow-700 mt-1">
                  Your account is awaiting admin approval. You'll be able to enroll in courses once approved.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {approvalStatus === 'approved' && (
        <>
          {/* Stats Cards */}
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="bg-gradient-to-br from-purple-50 to-pink-100 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Course Preferences</p>
                    <p className="text-2xl font-bold text-purple-700">
                      {loading ? '...' : preferenceCount}
                    </p>
                  </div>
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Enrolled Courses</p>
                    <p className="text-2xl font-bold text-blue-700">
                      {loading ? '...' : enrollmentCount}
                    </p>
                  </div>
                  <GraduationCap className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-emerald-50 to-teal-100 border-emerald-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Total Credits</p>
                    <p className="text-2xl font-bold text-emerald-700">
                      {loading ? '...' : totalCredits}
                    </p>
                  </div>
                  <GraduationCap className="h-8 w-8 text-emerald-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Status</p>
                    <p className="text-lg font-semibold text-purple-700">Active</p>
                  </div>
                  <CheckCircle2 className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">Department</p>
                    <p className="text-lg font-semibold text-orange-700">
                      {user?.department || '—'}
                    </p>
                  </div>
                  <User className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-blue-50 to-cyan-50 border-blue-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-blue-700">
                  <BookOpen className="h-5 w-5" />
                  Browse Courses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Explore courses and add them to your preferences.
                </p>
                <Link to="/courses">
                  <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700">View Courses</Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-purple-700">
                  <BookOpen className="h-5 w-5" />
                  My Preferences
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  Manage your course preferences and rankings.
                </p>
                <Link to="/preferences">
                  <Button variant="outline" className="w-full border-purple-300 text-purple-700 hover:bg-purple-50">View Preferences</Button>
                </Link>
              </CardContent>
            </Card>
            <Card className="hover:shadow-lg transition-shadow bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-emerald-700">
                  <GraduationCap className="h-5 w-5" />
                  My Enrollments
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  View your enrolled courses.
                </p>
                <Link to="/enrollments">
                  <Button variant="outline" className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50">View Enrollments</Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* Profile Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Profile Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 md:grid-cols-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Name</span>
                  <span className="font-medium">{user?.name || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Roll No</span>
                  <span className="font-medium">{user?.roll_no || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Email</span>
                  <span className="font-medium">{user?.email || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Department</span>
                  <span className="font-medium">{user?.department || '—'}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Semester</span>
                  <span className="font-medium">{user?.semester || '—'}</span>
                </div>
                {user?.cgpa != null && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">CGPA</span>
                    <span className="font-medium">{user.cgpa}</span>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
