'use client';
import { clearAuthCookies, getAuthCookieSession } from '@/actions/authCookies';
import { loginWithAzure, refreshToken } from '@/lib/auth/authService';
import { AuthUserPayload } from '@/lib/types';
import { createContext, ReactNode, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: AuthUserPayload | null;
  loading: boolean;
  login: () => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  initialToken: string | null;
  initialUser: AuthUserPayload | null;
};

export function AuthProvider({ children, initialToken, initialUser }: AuthProviderProps) {
  const [token, setToken] = useState<string | null>(initialToken);
  const [user, setUser] = useState<AuthUserPayload | null>(initialUser);
  const loading = false;
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialToken);

  useEffect(() => {
    const checkToken = async () => {
      if (typeof window === 'undefined') return;

      const cookieSession = await getAuthCookieSession();
      const storedToken = cookieSession.token;
      const expiryTime = cookieSession.expiryTime;

      if (storedToken && expiryTime && Date.now() < parseInt(expiryTime, 10)) {
        setToken(storedToken);
        setIsAuthenticated(true);
      } else {
        await clearAuthCookies();
        setToken(null);
        setUser(null);
        setIsAuthenticated(false);
      }
    };

    const intervalId = setInterval(() => {
      void checkToken();
    }, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const logout = async () => {
    await clearAuthCookies();
    setToken(null);
    setUser(null);
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  const authValues = {
    isAuthenticated,
    token,
    user,
    loading,
    login: loginWithAzure,
    logout,
    refreshToken,
  };

  return <AuthContext.Provider value={authValues}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
