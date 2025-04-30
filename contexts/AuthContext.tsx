'use client';
import { loginWithAzure, refreshToken } from '@/lib/auth/authService';
import { createContext, useContext, useEffect, useState } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  token: string | null;
  user: unknown;
  loading: boolean;
  login: () => void;
  logout: () => void;
  refreshToken: () => Promise<boolean>;
}

export const AuthContext = createContext<AuthContextType | null>(null);

import { ReactNode } from 'react';

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkToken = () => {
      if (typeof window === 'undefined') return;

      const storedToken = sessionStorage.getItem('azure_token');
      const expiryTime = sessionStorage.getItem('azure_token_expiry');

      if (storedToken && expiryTime && Date.now() < parseInt(expiryTime, 10)) {
        setToken(storedToken);
        setIsAuthenticated(true);
      } else {
        sessionStorage.removeItem('azure_token');
        sessionStorage.removeItem('azure_refresh_token');
        sessionStorage.removeItem('azure_token_expiry');
        setToken(null);
        setUser(null);
      }
      setLoading(false);
    };

    checkToken();

    const intervalId = setInterval(checkToken, 60000);

    return () => clearInterval(intervalId);
  }, []);

  const logout = () => {
    sessionStorage.removeItem('azure_token');
    sessionStorage.removeItem('azure_refresh_token');
    sessionStorage.removeItem('azure_token_expiry');
    setToken(null);
    setUser(null);
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
