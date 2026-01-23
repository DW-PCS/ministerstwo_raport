'use client';

import SuccessState from '@/components/auth/SuccessState';
// import { useAuthCallback } from '@/hooks/useAuthCallback';

export default function AuthCallback() {
  // const { isProcessing, error } = useAuthCallback();

  // if (isProcessing) {
  //   return <LoadingState />;
  // }

  // if (error) {
  //   return <ErrorState error={error} />;
  // }

  return <SuccessState />;
}
