import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

interface AuthUser {
  id: string;
  full_name: string;
  email: string;
  role: 'Admin' | 'Operator';
  is_active: boolean;
}

interface AuthContextType {
  user: AuthUser | null;
  token: string | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
  isAdmin: () => boolean;
}

const AuthContext = createContext<AuthContextType | null>(null);

const TOKEN_KEY = 'titus_auth_token';
const USER_KEY  = 'titus_auth_user';

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [token, setToken]     = useState<string | null>(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser]       = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(USER_KEY);
    try { return raw ? JSON.parse(raw) : null; } catch { return null; }
  });
  const [isLoading, setIsLoading] = useState(false);

  // On mount, if we have a token verify it is still valid
  useEffect(() => {
    if (!token) return;
    fetch('/api/v1/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then(r => {
        if (!r.ok) throw new Error('expired');
        return r.json();
      })
      .then((data: AuthUser) => {
        setUser(data);
        localStorage.setItem(USER_KEY, JSON.stringify(data));
      })
      .catch(() => {
        // Token is invalid/expired — clear everything
        localStorage.removeItem(TOKEN_KEY);
        localStorage.removeItem(USER_KEY);
        setToken(null);
        setUser(null);
      });
  }, []); // run only once on mount

  const login = useCallback(async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/v1/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        return { success: false, error: data.detail || 'Invalid email or password.' };
      }

      const { access_token } = await res.json();

      // Fetch user profile
      const meRes = await fetch('/api/v1/auth/me', {
        headers: { Authorization: `Bearer ${access_token}` },
      });
      if (!meRes.ok) return { success: false, error: 'Failed to load user profile.' };

      const userData: AuthUser = await meRes.json();

      // Persist
      localStorage.setItem(TOKEN_KEY, access_token);
      localStorage.setItem(USER_KEY, JSON.stringify(userData));
      setToken(access_token);
      setUser(userData);

      return { success: true };
    } catch {
      return { success: false, error: 'Network error. Is the backend running?' };
    } finally {
      setIsLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    // Also clear the old key used by the dev bypass
    localStorage.removeItem('active_job_id');
    setToken(null);
    setUser(null);
  }, []);

  const isAdmin = useCallback(() => user?.role === 'Admin', [user]);

  return (
    <AuthContext.Provider value={{ user, token, isLoading, login, logout, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
};
