import LoadingState from '@/components/auth/LoadingState';
import { Suspense } from 'react';
import AuthCallback from './AuthCallback';

const Page = () => {
  return (
    <Suspense fallback={<LoadingState />}>
      <AuthCallback />
    </Suspense>
  );
};

export default Page;
