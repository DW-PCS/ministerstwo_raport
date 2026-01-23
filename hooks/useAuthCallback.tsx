// import { exchangeCodeForToken } from '@/lib/auth/authService';
// import Cookies from 'js-cookie';
// import { useRouter, useSearchParams } from 'next/navigation';
// import { useEffect, useState } from 'react';

// export function useAuthCallback() {
//   const [error, setError] = useState<string | null>(null);
//   const [isProcessing, setIsProcessing] = useState(true);
//   const [isSuccess, setIsSuccess] = useState(false);
//   const router = useRouter();
//   const searchParams = useSearchParams();

//   useEffect(() => {
//     async function processAuthCallback() {
//       try {
//         const code = searchParams.get('code');
//         const state = searchParams.get('state');

//         if (!code) {
//           throw new Error('No authorization code received');
//         }

//         if (!state) {
//           throw new Error('No state parameter received');
//         }

//         const tokenResponse = await exchangeCodeForToken(code, state);

//         if (tokenResponse && tokenResponse.access_token) {
//           setIsSuccess(true);
//         }
//         if (!tokenResponse) {
//           throw new Error('Failed to exchange code for token');
//         }

//         storeAuthTokens(tokenResponse);

//         router.push('/');
//       } catch (err) {
//         setError(err instanceof Error ? err.message : 'Unknown authentication error');
//       } finally {
//         setIsProcessing(false);
//       }
//     }

//     processAuthCallback();
//   }, [searchParams, router]);

//   return { isProcessing, error, isSuccess };
// }

// function storeAuthTokens(tokenResponse: {
//   access_token: string;
//   refresh_token: string;
//   expires_in: number;
// }) {
//   const expiryDate = new Date(Date.now() + tokenResponse.expires_in * 1000);

//   sessionStorage.setItem('azure_token', tokenResponse.access_token);
//   sessionStorage.setItem('azure_refresh_token', tokenResponse.refresh_token);
//   sessionStorage.setItem('azure_token_expiry', expiryDate.getTime().toString());

//   const cookieOptions = {
//     expires: expiryDate,
//     secure: process.env.NODE_ENV === 'production',
//     sameSite: 'strict' as const,
//     path: '/',
//   };

//   Cookies.set('azure_token', tokenResponse.access_token, cookieOptions);
//   Cookies.set('azure_refresh_token', tokenResponse.refresh_token, cookieOptions);
//   Cookies.set('azure_token_expiry', expiryDate.getTime().toString(), cookieOptions);
// }
