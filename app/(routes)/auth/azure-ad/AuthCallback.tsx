'use client';

import SuccessState from '@/components/auth/SuccessState';
import { useAuthCallback } from '@/hooks/useAuthCallback';
import { Spin } from 'antd';

export default function AuthCallback() {
  const { isProcessing, error } = useAuthCallback();

  if (error || isProcessing) {
    return (
      <div className="h-screen flex justify-center items-center">
        <Spin size="large" />;
      </div>
    );
  }

  return <SuccessState />;
}
