import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, BookOpen, Zap, TrendingUp, Clock } from 'lucide-react';

interface DashboardStats {
  total_students: number;
  pending_approvals: number;
  total_courses: number;
  total_capacity: number;
  seats_allotted: number;
  seats_waitlisted: number;
  utilization_percent: number;
}

export function AdminDashboard() {
  const { accessToken } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!accessToken) return;

    setLoading(true);
    api<DashboardStats>('/admin/dashboard/stats', { token: accessToken })
      .then(setStats)
      .catch((e) => setError(e instanceof Error ? e.message : 'Failed to load stats'))
      .finally(() => setLoading(false));
  }, [accessToken]);

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground">Loading…</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">Overview of college course portal</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Students */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <Users className="h-4 w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_students ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active students</p>
          </CardContent>
        </Card>

        {/* Pending Approvals */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
              <Clock className="h-4 w-4 text-yellow-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.pending_approvals ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting review</p>
          </CardContent>
        </Card>

        {/* Total Courses */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_courses ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Active courses</p>
          </CardContent>
        </Card>

        {/* Total Capacity */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Total Capacity</CardTitle>
              <Zap className="h-4 w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.total_capacity ?? 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Available seats</p>
          </CardContent>
        </Card>

        {/* Utilization */}
        <Card>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm font-medium">Utilization</CardTitle>
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.utilization_percent ?? 0}%</div>
            <p className="text-xs text-muted-foreground mt-1">Seat usage</p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Enrollment Summary</CardTitle>
          <p className="text-sm text-muted-foreground">Current enrollment statistics</p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Total Enrollments</p>
              <p className="text-4xl font-bold text-green-600">{stats?.seats_allotted ?? 0}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-green-600 h-2 rounded-full"
                  style={{
                    width: `${
                      stats?.total_capacity && stats.total_capacity > 0
                        ? ((stats.seats_allotted ?? 0) / stats.total_capacity) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Pending Enrollments</p>
              <p className="text-4xl font-bold text-orange-600">{stats?.seats_waitlisted ?? 0}</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-orange-600 h-2 rounded-full"
                  style={{
                    width: `${
                      stats?.total_capacity && stats.total_capacity > 0
                        ? ((stats.seats_waitlisted ?? 0) / stats.total_capacity) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>

            <div className="space-y-2">
              <p className="text-sm font-medium text-muted-foreground">Available Seats</p>
              <p className="text-4xl font-bold text-blue-600">
                {Math.max(0, (stats?.total_capacity ?? 0) - (stats?.seats_allotted ?? 0) - (stats?.seats_waitlisted ?? 0))}
              </p>
              <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{
                    width: `${
                      stats?.total_capacity && stats.total_capacity > 0
                        ? ((Math.max(0, stats.total_capacity - (stats.seats_allotted ?? 0) - (stats.seats_waitlisted ?? 0))) / stats.total_capacity) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
