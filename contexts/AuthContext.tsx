'use client';
import { clearAuthCookies, getAuthCookieSession } from '@/actions/authCookies';
import { loginAction, logoutAction } from '@/actions/auth';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  initialToken: string | null;
};

export function AuthProvider({ children, initialToken }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialToken);
  const loading = false;

  useEffect(() => {
    const checkToken = async () => {
      if (typeof window === 'undefined') return;
      const cookieSession = await getAuthCookieSession();
      if (cookieSession.token) {
        setToken(cookieSession.token);
        setIsAuthenticated(true);
      } else {
        await clearAuthCookies();
        setToken(null);
        setIsAuthenticated(false);
      }
    };

    const intervalId = setInterval(() => void checkToken(), 60000);
    return () => clearInterval(intervalId);
  }, []);

  const login = async (username: string, password: string) => {
    const result = await loginAction(username, password);
    if (result.success) {
      const cookieSession = await getAuthCookieSession();
      setToken(cookieSession.token);
      setIsAuthenticated(true);
    }
    return result;
  };

  const logout = async () => {
    await logoutAction();
    setToken(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, token, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
