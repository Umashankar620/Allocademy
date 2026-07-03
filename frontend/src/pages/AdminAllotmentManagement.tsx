import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { AlertCircle, CheckCircle2, XCircle, Loader } from 'lucide-react';

interface PendingRequest {
  request_id: number;
  roll_no: string;
  student_name: string;
  student_email: string;
  course_id: string;
  course_name: string;
  credits: number;
  faculty: string;
  slot: string;
  request_date: string;
  status: string;
}

interface Course {
  course_id: string;
  course_name: string;
  credits: number;
  faculty: string;
  slot: string;
  capacity: number;
  course_type: string;
}

export function AdminAllotmentManagement() {
  const { accessToken } = useAuth();
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [courses, setCourses] = useState<Course[]>([]);
  const [loading, setLoading] = useState(true);
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rejectReason, setRejectReason] = useState<{ [key: number]: string }>({});
  const [rejectionDialogOpen, setRejectionDialogOpen] = useState<number | null>(null);
  const [selectedCourseForCompulsory, setSelectedCourseForCompulsory] = useState('');
  const [allottingCompulsory, setAllottingCompulsory] = useState(false);

  const fetchData = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError('');

      // Fetch pending requests
      const requestsRes = await api<{ requests: PendingRequest[] }>('/requests/pending', {
        token: accessToken,
      });
      setPendingRequests(requestsRes.requests || []);

      // Fetch courses for compulsory allotment
      const coursesRes = await api<{ courses: Course[] }>('/courses?status=active', {
        token: accessToken,
      });
      setCourses(coursesRes.courses || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [accessToken]);

  const handleApprove = async (requestId: number) => {
    if (!accessToken) return;

    try {
      setProcessingId(requestId);
      setError('');
      setSuccess('');
      await api(`/requests/${requestId}/approve`, {
        method: 'POST',
        token: accessToken,
      });
      setSuccess('Course request approved!');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to approve request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectSubmit = async (requestId: number) => {
    if (!accessToken) return;

    try {
      setProcessingId(requestId);
      setError('');
      setSuccess('');
      
      const reasonText = rejectReason[requestId] || '';
      
      const response = await fetch(`http://localhost:5000/requests/${requestId}/reject`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
        },
        body: JSON.stringify({ reason: reasonText }),
      });
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error);
      
      setSuccess('Course request rejected!');
      setRejectionDialogOpen(null);
      setRejectReason({});
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reject request');
    } finally {
      setProcessingId(null);
    }
  };

  const handleAllotCompulsory = async () => {
    if (!accessToken || !selectedCourseForCompulsory) {
      setError('Please select a course');
      return;
    }

    try {
      setAllottingCompulsory(true);
      setError('');
      setSuccess('');
      await api(`/requests/allot-compulsory/${selectedCourseForCompulsory}`, {
        method: 'POST',
        token: accessToken,
      });
      setSuccess('Compulsory course allotted to all eligible students!');
      setSelectedCourseForCompulsory('');
      fetchData();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to allot compulsory course');
    } finally {
      setAllottingCompulsory(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-violet-600 mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading allotment data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-to-r from-violet-600 to-indigo-600 bg-clip-text text-transparent">
          Course Allotment Management
        </h1>
        <p className="text-muted-foreground mt-1">Approve/reject course requests and allot compulsory courses</p>
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

      {/* Allot Compulsory Courses */}
      <Card className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-amber-600" />
            Allot Compulsory Courses
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Select a course to allot it to all eligible students from the same department.
          </p>
          <div className="flex gap-3">
            <select
              value={selectedCourseForCompulsory}
              onChange={(e) => setSelectedCourseForCompulsory(e.target.value)}
              disabled={allottingCompulsory}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="">Select a course...</option>
              {courses
                .filter((c) => c.course_type === 'core')
                .map((course) => (
                  <option key={course.course_id} value={course.course_id}>
                    {course.course_name} ({course.course_id})
                  </option>
                ))}
            </select>
            <Button
              onClick={handleAllotCompulsory}
              disabled={allottingCompulsory || !selectedCourseForCompulsory}
              className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700"
            >
              {allottingCompulsory ? (
                <>
                  <Loader className="h-4 w-4 mr-2 animate-spin" />
                  Allotting...
                </>
              ) : (
                'Allot Course'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Pending Course Requests */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-violet-600" />
            Pending Course Requests ({pendingRequests.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {pendingRequests.length === 0 ? (
            <div className="text-center py-12">
              <CheckCircle2 className="h-12 w-12 text-green-500 mx-auto mb-4 opacity-50" />
              <p className="text-muted-foreground">No pending course requests!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {pendingRequests.map((request) => (
                <div
                  key={request.request_id}
                  className="p-4 border rounded-lg hover:bg-slate-50 transition"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Student Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Student</h3>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Name:</span> {request.student_name}
                        </p>
                        <p>
                          <span className="font-medium">Roll No:</span> {request.roll_no}
                        </p>
                        <p>
                          <span className="font-medium">Email:</span> {request.student_email}
                        </p>
                      </div>
                    </div>

                    {/* Course Info */}
                    <div>
                      <h3 className="font-semibold text-gray-900 mb-2">Course</h3>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Course:</span> {request.course_name} ({request.course_id})
                        </p>
                        <p>
                          <span className="font-medium">Credits:</span> {request.credits}
                        </p>
                        <p>
                          <span className="font-medium">Faculty:</span> {request.faculty}
                        </p>
                        <p>
                          <span className="font-medium">Slot:</span> {request.slot}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Request Date */}
                  <p className="text-xs text-muted-foreground mt-3 mb-4">
                    Requested on: {new Date(request.request_date).toLocaleString()}
                  </p>

                  {/* Rejection Reason Input */}
                  {rejectionDialogOpen === request.request_id && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                      <label className="block text-sm font-medium text-gray-700 mb-2">Rejection Reason (optional):</label>
                      <Input
                        type="text"
                        placeholder="Explain why you're rejecting this request..."
                        value={rejectReason[request.request_id] || ''}
                        onChange={(e) =>
                          setRejectReason({
                            ...rejectReason,
                            [request.request_id]: e.target.value,
                          })
                        }
                        className="mb-3"
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleRejectSubmit(request.request_id)}
                          disabled={processingId === request.request_id}
                          className="bg-red-600 hover:bg-red-700"
                          size="sm"
                        >
                          {processingId === request.request_id ? 'Processing...' : 'Confirm Rejection'}
                        </Button>
                        <Button
                          onClick={() => setRejectionDialogOpen(null)}
                          variant="outline"
                          size="sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* Action Buttons */}
                  {rejectionDialogOpen !== request.request_id && (
                    <div className="flex gap-3">
                      <Button
                        onClick={() => handleApprove(request.request_id)}
                        disabled={processingId === request.request_id}
                        className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
                        size="sm"
                      >
                        {processingId === request.request_id ? (
                          <>
                            <Loader className="h-4 w-4 mr-2 animate-spin" />
                            Approving...
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="h-4 w-4 mr-2" />
                            Approve
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => setRejectionDialogOpen(request.request_id)}
                        disabled={processingId === request.request_id}
                        variant="outline"
                        className="border-red-300 text-red-700 hover:bg-red-50"
                        size="sm"
                      >
                        <XCircle className="h-4 w-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
