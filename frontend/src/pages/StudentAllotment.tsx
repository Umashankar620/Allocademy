import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { AlertCircle, CheckCircle2, BookOpen, Plus, Clock, X } from 'lucide-react';

interface AllottedCourse {
  course_id: string;
  course_name: string;
  credits: number;
  faculty: string;
  slot: string;
  course_type: string;
  status: string;
}

interface AvailableCourse {
  course_id: string;
  course_name: string;
  credits: number;
  faculty: string;
  slot: string;
  capacity: number;
  allotted_count: number;
  available_seats: number;
  course_type: string;
}

interface CourseRequest {
  request_id: number;
  course_id: string;
  course_name: string;
  credits: number;
  faculty: string;
  slot: string;
  status: 'pending' | 'approved' | 'rejected';
  request_date: string;
}

export function StudentAllotment() {
  const { accessToken } = useAuth();
  const [allottedCourses, setAllottedCourses] = useState<AllottedCourse[]>([]);
  const [availableCourses, setAvailableCourses] = useState<AvailableCourse[]>([]);
  const [requests, setRequests] = useState<CourseRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showAvailable, setShowAvailable] = useState(false);

  const fetchData = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError('');

      // Fetch allotted courses
      const allottedRes = await api<{ allotted: AllottedCourse[]; waitlisted: AllottedCourse[]; published: boolean }>(
        '/allotments/me',
        { token: accessToken }
      );
      setAllottedCourses([...(allottedRes.allotted || []), ...(allottedRes.waitlisted || [])]);

      // Fetch requests
      const requestsRes = await api<{ requests: CourseRequest[] }>('/requests', {
        token: accessToken,
      });
      setRequests(requestsRes.requests || []);

      // Fetch available courses
      if (showAvailable) {
        const availableRes = await api<{ courses: AvailableCourse[] }>('/requests/available/list', {
          token: accessToken,
        });
        setAvailableCourses(availableRes.courses || []);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken, showAvailable]);

  const handleRequestCourse = async (courseId: string) => {
    if (!accessToken) return;

    try {
      setError('');
      setSuccess('');
      await api(`/requests/${courseId}`, {
        method: 'POST',
        token: accessToken,
      });
      setSuccess('Course request submitted successfully!');
      setShowAvailable(false);
      setTimeout(() => fetchData(), 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit request');
    }
  };

  const getRequestStatus = (courseId: string) => {
    const request = requests.find((r) => r.course_id === courseId);
    return request?.status || null;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'allotted':
        return 'bg-emerald-50 border-emerald-200';
      case 'waitlisted':
        return 'bg-orange-50 border-orange-200';
      default:
        return 'bg-slate-50 border-slate-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'allotted':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case 'waitlisted':
        return <Clock className="h-5 w-5 text-orange-600" />;
      default:
        return null;
    }
  };

  if (loading && !allottedCourses.length) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading your courses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          My Course Allotment
        </h1>
        <p className="text-muted-foreground mt-1">View your allotted courses and request new ones</p>
      </div>

      {error && (
        <Card className="bg-red-50 border-red-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-600" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {success && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="pt-6">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <p className="text-sm text-green-700">{success}</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Allotted Courses Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5 text-violet-600" />
            Your Allotted Courses
          </CardTitle>
        </CardHeader>
        <CardContent>
          {allottedCourses.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">No courses allotted yet. Request courses below!</p>
          ) : (
            <div className="grid gap-4 md:grid-cols-2">
              {allottedCourses.map((course) => (
                <div
                  key={course.course_id}
                  className={`p-4 rounded-lg border-2 ${getStatusColor(course.status)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {getStatusIcon(course.status)}
                        <h3 className="font-semibold text-gray-900">{course.course_name}</h3>
                      </div>
                      <div className="space-y-1 text-sm text-gray-600">
                        <p>
                          <span className="font-medium">Code:</span> {course.course_id}
                        </p>
                        <p>
                          <span className="font-medium">Credits:</span> {course.credits}
                        </p>
                        <p>
                          <span className="font-medium">Faculty:</span> {course.faculty}
                        </p>
                        <p>
                          <span className="font-medium">Slot:</span> {course.slot}
                        </p>
                        <p>
                          <span className="font-medium">Type:</span>{' '}
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              course.course_type === 'core'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-purple-100 text-purple-800'
                            }`}
                          >
                            {course.course_type}
                          </span>
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Your Requests */}
      {requests.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-blue-600" />
              Your Course Requests
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {requests.map((request) => (
                <div key={request.request_id} className="flex items-center justify-between p-3 border rounded-lg bg-slate-50">
                  <div>
                    <p className="font-medium text-gray-900">{request.course_name}</p>
                    <p className="text-sm text-gray-600">{request.course_id}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${
                        request.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : request.status === 'approved'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Request New Courses */}
      <Card className="bg-gradient-to-r from-blue-50 to-cyan-50 border-blue-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-blue-600" />
            Request New Courses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showAvailable ? (
            <Button
              onClick={() => setShowAvailable(true)}
              className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700"
            >
              Browse Available Courses
            </Button>
          ) : (
            <>
              <Button
                onClick={() => setShowAvailable(false)}
                variant="outline"
                className="w-full"
              >
                <X className="h-4 w-4 mr-2" />
                Hide Available Courses
              </Button>

              {availableCourses.length === 0 ? (
                <p className="text-center text-muted-foreground py-6">All available courses displayed above or already requested.</p>
              ) : (
                <div className="space-y-3 max-h-96 overflow-y-auto">
                  {availableCourses.map((course) => {
                    const requestStatus = getRequestStatus(course.course_id);
                    const isRequested = requestStatus === 'pending';
                    const isAlreadyEnrolled = allottedCourses.some((c) => c.course_id === course.course_id);

                    return (
                      <div key={course.course_id} className="p-4 border rounded-lg bg-white hover:border-blue-400 transition">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <h4 className="font-semibold text-gray-900">{course.course_name}</h4>
                            <div className="grid grid-cols-2 gap-2 mt-2 text-sm text-gray-600">
                              <p>
                                <span className="font-medium">Code:</span> {course.course_id}
                              </p>
                              <p>
                                <span className="font-medium">Credits:</span> {course.credits}
                              </p>
                              <p>
                                <span className="font-medium">Faculty:</span> {course.faculty}
                              </p>
                              <p>
                                <span className="font-medium">Slot:</span> {course.slot}
                              </p>
                              <p>
                                <span className="font-medium">Seats:</span> {course.available_seats}/{course.capacity}
                              </p>
                              <p>
                                <span className="font-medium">Type:</span>{' '}
                                <span className={course.course_type === 'core' ? 'text-blue-600' : 'text-purple-600'}>
                                  {course.course_type}
                                </span>
                              </p>
                            </div>
                          </div>
                          <Button
                            onClick={() => handleRequestCourse(course.course_id)}
                            disabled={isRequested || isAlreadyEnrolled || loading}
                            className="ml-4 shrink-0"
                          >
                            {isRequested ? 'Requested' : isAlreadyEnrolled ? 'Enrolled' : 'Request'}
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
