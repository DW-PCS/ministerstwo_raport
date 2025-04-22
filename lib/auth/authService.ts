'use client';

const config = {
  clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID,
  authority: 'https://login.microsoftonline.com/common',
  scopes: [process.env.NEXT_PUBLIC_AZURE_AD_SCOPE]
};

function getAppOrigin(): string {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  window.crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

function base64UrlEncode(buffer: ArrayBufferLike | Uint8Array): string {
  return btoa(String.fromCharCode.apply(null, [...(buffer instanceof Uint8Array ? buffer : new Uint8Array(buffer))]))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

async function generateCodeChallenge(codeVerifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(codeVerifier);
  const digest = await window.crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(digest);
}

export async function loginWithAzure(): Promise<void> {
  if (typeof window === 'undefined') return;

  const codeVerifier = generateCodeVerifier();
  sessionStorage.setItem('code_verifier', codeVerifier);

  const codeChallenge = await generateCodeChallenge(codeVerifier);

  const state = generateRandomState();
  sessionStorage.setItem('auth_state', state);

  const appOrigin = getAppOrigin();
  const redirectUri = `${appOrigin}/auth/azure-ad`;

  const authUrl = new URL(`${config.authority}/oauth2/v2.0/authorize`);
  if (!config.clientId) {
    throw new Error('Azure AD Client ID is not defined');
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
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  [key: string]: unknown;
}

export async function exchangeCodeForToken(code: string, state: string): Promise<TokenResponse> {
  try {
    const savedState: string | null = sessionStorage.getItem('auth_state');
    if (state !== savedState) {
      throw new Error('State mismatch - possible CSRF attack');
    }

    const codeVerifier: string | null = sessionStorage.getItem('code_verifier');
    if (!codeVerifier) {
      throw new Error('Code verifier not found');
    }

    const response: Response = await fetch('/api/auth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        code,
        codeVerifier
      })
    });

    if (!response.ok) {
      const errorData: { error?: string } = await response.json();
      throw new Error(errorData.error || 'Failed to exchange code for token');
    }

    sessionStorage.removeItem('code_verifier');
    sessionStorage.removeItem('auth_state');

    return await response.json() as TokenResponse;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    throw error;
  }
}

export async function refreshToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const currentRefreshToken = sessionStorage.getItem('azure_refresh_token');
  if (!currentRefreshToken) return false;

  try {
    const response = await fetch('/api/auth/refresh', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        refreshToken: currentRefreshToken
      })
    });

    if (!response.ok) {
      throw new Error('Failed to refresh token');
    }

    const tokenData = await response.json();

    sessionStorage.setItem('azure_token', tokenData.access_token);
    sessionStorage.setItem('azure_refresh_token', tokenData.refresh_token);
    sessionStorage.setItem('azure_token_expiry', (Date.now() + (tokenData.expires_in * 1000)).toString());

    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    return false;
  }
}

function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}
