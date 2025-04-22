import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import { exchangeCodeForToken } from '@/lib/auth/authService';

export function useAuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    async function processAuthCallback() {
      try {
        const code = searchParams.get('code');
        const state = searchParams.get('state');

        if (!code) {
          throw new Error('No authorization code received');
        }

        if (!state) {
          throw new Error('No state parameter received');
        }

        const tokenResponse = await exchangeCodeForToken(code, state);

        storeAuthTokens(tokenResponse);

        router.push('/');
      } catch (err) {
        console.error('Authentication error:', err);
        setError(err instanceof Error ? err.message : 'Unknown authentication error');
      } finally {
        setIsProcessing(false);
      }
    }

    processAuthCallback();
  }, [searchParams, router]);

  return { isProcessing, error };
}

function storeAuthTokens(tokenResponse: {
  access_token: string;
  refresh_token: string;
  expires_in: number
}) {
  sessionStorage.setItem('azure_token', tokenResponse.access_token);
  sessionStorage.setItem('azure_refresh_token', tokenResponse.refresh_token);
  sessionStorage.setItem(
    'azure_token_expiry',
    (Date.now() + (tokenResponse.expires_in * 1000)).toString()
  );
}
