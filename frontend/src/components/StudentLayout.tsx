import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { LayoutDashboard, BookOpen, ListOrdered, ClipboardList, GraduationCap, User, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const nav = [
  { to: '/', end: true, label: 'Dashboard', icon: LayoutDashboard },
  { to: '/courses', end: false, label: 'Available Courses', icon: BookOpen },
  { to: '/preferences', end: false, label: 'My Preferences', icon: ListOrdered },
  { to: '/allotment', end: false, label: 'My Allotment', icon: ClipboardList },
  { to: '/enrollments', end: false, label: 'My Enrollments', icon: GraduationCap },
  { to: '/profile', end: false, label: 'Profile', icon: User },
] as const;

export function StudentLayout() {
  const { user, role, logout } = useAuth();
  const navigate = useNavigate();
  const isStudent = role === 'student';

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <div className="min-h-screen flex bg-[#F5F7FB]">
      <aside className="w-56 border-r bg-card flex flex-col shrink-0">
        <div className="p-4 border-b">
          <h2 className="font-semibold text-lg">College Course Portal</h2>
          <p className="text-xs text-muted-foreground">{isStudent ? 'Student' : 'Admin'}</p>
        </div>
        <nav className="p-2 flex-1">
          {nav.map(({ to, end, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <Icon className="h-4 w-4" />
              {label}
            </NavLink>
          ))}
        </nav>
        <div className="p-2 border-t">
          <Button variant="ghost" className="w-full justify-start gap-2" onClick={handleLogout}>
            <LogOut className="h-4 w-4" />
            Logout
          </Button>
        </div>
      </aside>
      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-14 border-b bg-card px-6 flex items-center gap-4 shrink-0">
          <Input placeholder="Search..." className="max-w-xs" />
          <div className="ml-auto flex items-center gap-2">
            <span className="text-sm text-muted-foreground">{user?.name ?? user?.email}</span>
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-sm font-medium">
              {(user?.name ?? user?.email ?? '?').charAt(0).toUpperCase()}
            </div>
          </div>
        </header>
        <main className="flex-1 p-6 overflow-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
