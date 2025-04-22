'use client';

import LoginButton from '@/components/auth/LoginButton';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function LoginClient() {
  const { isAuthenticated, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

  if (loading) {
    return <p>Loading...</p>;
  }

  return (
    <>
      {isAuthenticated ? (
        <p>You are already logged in! Redirecting...</p>
      ) : (
        <>
          <p className="mb-6">Please log in to access the protected content.</p>
          <LoginButton />
        </>
      )}
    </>
  );
}
