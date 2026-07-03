import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Profile() {
  const { user } = useAuth();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Profile</h1>
      <Card className="max-w-md">
        <CardHeader>
          <CardTitle>Your details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm">
          <p><span className="text-muted-foreground">Name</span> {user?.name ?? '–'}</p>
          <p><span className="text-muted-foreground">Roll No</span> {user?.roll_no ?? '–'}</p>
          <p><span className="text-muted-foreground">Email</span> {user?.email}</p>
          <p><span className="text-muted-foreground">Department</span> {user?.department ?? '–'}</p>
          <p><span className="text-muted-foreground">Semester</span> {user?.semester ?? '–'}</p>
          {user?.cgpa != null && <p><span className="text-muted-foreground">CGPA</span> {user.cgpa}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
