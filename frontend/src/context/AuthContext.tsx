import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import { api } from '@/lib/api';

type User = { id: number | string; name?: string; roll_no?: string; email: string; department?: string; semester?: number; cgpa?: number | null; status?: string };
type AuthState = {
  user: User | null;
  role: 'student' | 'admin' | null;
  accessToken: string | null;
  loading: boolean;
  login: (emailOrRoll: string, password: string) => Promise<'student' | 'admin'>;
  signup: (body: SignupBody) => Promise<void>;
  logout: () => void;
};

type SignupBody = {
  name: string;
  roll_no: string;
  email: string;
  department: string;
  semester: number;
  password: string;
};

const AuthContext = createContext<AuthState | null>(null);

const TOKEN_KEY = 'course_allotment_access_token';
const REFRESH_KEY = 'course_allotment_refresh_token';
const USER_KEY = 'course_allotment_user';
const ROLE_KEY = 'course_allotment_role';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const s = sessionStorage.getItem(USER_KEY);
      return s ? (JSON.parse(s) as User) : null;
    } catch {
      return null;
    }
  });
  const [role, setRole] = useState<'student' | 'admin' | null>(() => sessionStorage.getItem(ROLE_KEY) as 'student' | 'admin' | null);
  const [accessToken, setAccessToken] = useState<string | null>(() => sessionStorage.getItem(TOKEN_KEY));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setUser(null);
    setRole(null);
    setAccessToken(null);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_KEY);
    sessionStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(ROLE_KEY);
  }, []);

  const login = useCallback(async (emailOrRoll: string, password: string) => {
    const data = await api<{
      role: 'student' | 'admin';
      accessToken: string;
      refreshToken: string;
      user: User;
    }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email_or_roll: emailOrRoll, password }),
    });
    sessionStorage.setItem(TOKEN_KEY, data.accessToken);
    sessionStorage.setItem(REFRESH_KEY, data.refreshToken);
    sessionStorage.setItem(USER_KEY, JSON.stringify(data.user));
    sessionStorage.setItem(ROLE_KEY, data.role);
    setAccessToken(data.accessToken);
    setUser(data.user);
    setRole(data.role);
    return data.role;
  }, []);

  const signup = useCallback(async (body: SignupBody) => {
    await api('/auth/signup', { method: 'POST', body: JSON.stringify(body) });
  }, []);

  useEffect(() => {
    if (!accessToken) {
      setLoading(false);
      return;
    }
    api<{ user: unknown }>('/auth/me', { token: accessToken })
      .then(() => { /* token valid, keep stored user */ })
      .catch(() => logout())
      .finally(() => setLoading(false));
  }, [accessToken, logout]);

  return (
    <AuthContext.Provider
      value={{ user, role, accessToken, loading, login, signup, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
