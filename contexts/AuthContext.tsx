'use client';
import { loginAction, logoutAction } from '@/actions/auth';
import { Button } from '@/components/ui/button';
import { SESSION_TIMEOUT_SECONDS } from '@/constants';
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from 'react';

interface AuthContextType {
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<{ success: boolean; error?: string }>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | null>(null);

type AuthProviderProps = {
  children: ReactNode;
  initialToken: string | null;
};

export function AuthProvider({ children, initialToken }: AuthProviderProps) {
  const [isAuthenticated, setIsAuthenticated] = useState(!!initialToken);
  const [sessionExpired, setSessionExpired] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  useEffect(() => {
    if (!isAuthenticated) return;

    const resetTimer = () => {
      clearTimeout(timerRef.current);
      timerRef.current = setTimeout(() => setSessionExpired(true), SESSION_TIMEOUT_SECONDS * 1000);
    };

    resetTimer();
    document.addEventListener('click', resetTimer);
    document.addEventListener('keydown', resetTimer);

    return () => {
      clearTimeout(timerRef.current);
      document.removeEventListener('click', resetTimer);
      document.removeEventListener('keydown', resetTimer);
    };
  }, [isAuthenticated]);

  const login = async (username: string, password: string) => {
    const result = await loginAction(username, password);
    if (result.success) {
      setIsAuthenticated(true);
    }
    return result;
  };

  const logout = async () => {
    await logoutAction();
    setIsAuthenticated(false);
    window.location.href = '/';
  };

  const handleSessionExpiredDismiss = async () => {
    await logoutAction();
    setIsAuthenticated(false);
    setSessionExpired(false);
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout }}>
      {children}
      {sessionExpired && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-sm text-center">
            <h2 className="text-xl font-semibold text-[#1a0069] mb-2">Sesja wygasła</h2>
            <p className="text-sm text-gray-600 mb-6">Zaloguj się ponownie, aby kontynuować.</p>
            <Button className="w-full" onClick={handleSessionExpiredDismiss}>OK</Button>
          </div>
        </div>
      )}
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
