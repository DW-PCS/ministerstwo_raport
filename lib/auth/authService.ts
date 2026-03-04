'use client';

import { getAuthCookieSession, setAuthCookies } from '@/actions/authCookies';
import { base64UrlEncode, generateCodeVerifier, getAppOrigin } from '@/lib/helpers';
import { toast } from 'sonner';

const config = {
  clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID,
  authority: 'https://login.microsoftonline.com/common',
  scopes: [process.env.NEXT_PUBLIC_AZURE_AD_SCOPE],
};

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

export async function loginWithAzure(): Promise<void> {
  if (typeof window === 'undefined') return;

  try {
    const codeVerifier = generateCodeVerifier();
    sessionStorage.setItem('code_verifier', codeVerifier);

    const codeChallenge = await generateCodeChallenge(codeVerifier);

    const state = generateRandomState();
    sessionStorage.setItem('auth_state', state);

    const appOrigin = getAppOrigin();
    const redirectUri = `${appOrigin}/auth/azure-ad`;

    const authUrl = new URL(`${config.authority}/oauth2/v2.0/authorize`);
    if (!config.clientId) {
      throw new Error('Nie zdefiniowano identyfikatora klienta Azure AD');
    }
    authUrl.searchParams.append('client_id', config.clientId);
    authUrl.searchParams.append('response_type', 'code');
    authUrl.searchParams.append('redirect_uri', redirectUri);
    authUrl.searchParams.append('scope', config.scopes.join(' '));
    authUrl.searchParams.append('response_mode', 'query');
    authUrl.searchParams.append('state', state);
    authUrl.searchParams.append('code_challenge', codeChallenge);
    authUrl.searchParams.append('code_challenge_method', 'S256');

    window.location.href = authUrl.toString();
  } catch (error) {
    console.error('Błąd inicjalizacji logowania:', error);
    toast.error(
      error instanceof Error ? error.message : 'Nie udało się zainicjalizować procesu logowania'
    );
  }
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  [key: string]: unknown;
}

export async function exchangeCodeForToken(
  code: string,
  state: string
): Promise<TokenResponse | null> {
  try {
    const savedState: string | null = sessionStorage.getItem('auth_state');
    if (state !== savedState) {
      throw new Error('Niezgodność parametru state - możliwy atak CSRF');
    }

    const codeVerifier: string | null = sessionStorage.getItem('code_verifier');
    if (!codeVerifier) {
      throw new Error('Nie znaleziono code verifier');
    }

    const response: Response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
        codeVerifier,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.error || `Nie udało się wymienić kodu na token (${response.status})`;
      toast.error(errorMessage);

      throw new Error(errorMessage);
    }

    sessionStorage.removeItem('code_verifier');
    sessionStorage.removeItem('auth_state');

    const tokenData = (await response.json()) as TokenResponse;
    toast.success('Zalogowano pomyślnie.');

    return tokenData;
  } catch (error) {
    console.error('Błąd podczas wymiany kodu na token:', error);
    toast.error(
      error instanceof Error ? error.message : 'Nie udało się zakończyć procesu uwierzytelniania'
    );
    return null;
  }
}

export async function refreshToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const cookieSession = await getAuthCookieSession();
  const currentRefreshToken = cookieSession.refreshToken;
  if (!currentRefreshToken) {
    toast.error('Twoja sesja wygasła. Zaloguj się ponownie.');
    return false;
  }

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        refreshToken: currentRefreshToken,
      }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        errorData.error || `Odświeżenie tokenu nie powiodło się (${response.status})`
      );
    }

    const tokenData = await response.json();

    toast.success('Sesja została pomyślnie odświeżona.');

    await setAuthCookies({
      accessToken: tokenData.access_token,
      refreshToken: tokenData.refresh_token,
      expiresIn: tokenData.expires_in,
    });

    return true;
  } catch (error) {
    console.error('Błąd odświeżania tokenu:', error);
    toast.error(
      error instanceof Error
        ? error.message
        : 'Nie udało się odświeżyć sesji. Zaloguj się ponownie.'
    );
    return false;
  }
}

function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}
