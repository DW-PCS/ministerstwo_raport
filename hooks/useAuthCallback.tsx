import { setAuthCookies } from '@/actions/authCookies';
import { exchangeCodeForToken } from '@/lib/auth/authService';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export function useAuthCallback() {
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [isSuccess, setIsSuccess] = useState(false);
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

        if (tokenResponse && tokenResponse.access_token) {
          setIsSuccess(true);
        }
        if (!tokenResponse) {
          throw new Error('Failed to exchange code for token');
        }

        await storeAuthTokens(tokenResponse);

        window.location.href = '/';
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unknown authentication error');
      } finally {
        setIsProcessing(false);
      }
    }

    processAuthCallback();
  }, [searchParams, router]);

  return { isProcessing, error, isSuccess };
}

async function storeAuthTokens(tokenResponse: {
  access_token: string;
  refresh_token: string;
  expires_in: number;
}) {
  await setAuthCookies({
    accessToken: tokenResponse.access_token,
    refreshToken: tokenResponse.refresh_token,
    expiresIn: tokenResponse.expires_in,
  });
}
