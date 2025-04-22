'use client';

import { toast } from "@/components/ui/use-toast";
import { base64UrlEncode, generateCodeVerifier, getAppOrigin } from "../helpers";

const config = {
  clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID,
  authority: 'https://login.microsoftonline.com/common',
  scopes: [process.env.NEXT_PUBLIC_AZURE_AD_SCOPE]
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
  } catch (error) {
    console.error('Login initialization error:', error);
    toast({
      variant: "destructive",
      title: "Authentication Error",
      description: error instanceof Error ? error.message : "Failed to initialize login process"
    });
  }
}

interface TokenResponse {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  [key: string]: unknown;
}

export async function exchangeCodeForToken(code: string, state: string): Promise<TokenResponse | null> {
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
      const errorData = await response.json();
      const errorMessage = errorData.error || `Failed to exchange code for token (${response.status})`;
          toast({
      title:  `Failed to exchange code for token (${response.status})`,
      description: errorMessage
    });

      throw new Error(errorMessage);
    }

    sessionStorage.removeItem('code_verifier');
    sessionStorage.removeItem('auth_state');

    const tokenData = await response.json() as TokenResponse;
    toast({
      title: "Authentication Successful",
      description: "You have successfully signed in."
    });

    return tokenData;
  } catch (error) {
    console.error('Error exchanging code for token:', error);
    toast({
      variant: "destructive",
      title: "Authentication Failed",
      description: error instanceof Error ? error.message : "Failed to complete the authentication process"
    });
    return null;
  }
}

export async function refreshToken(): Promise<boolean> {
  if (typeof window === 'undefined') return false;

  const currentRefreshToken = sessionStorage.getItem('azure_refresh_token');
  if (!currentRefreshToken) {
    toast({
      variant: "destructive",
      title: "Session Expired",
      description: "Your session has expired. Please sign in again."
    });
    return false;
  }

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
      const errorData = await response.json();
      throw new Error(errorData.error || `Token refresh failed (${response.status})`);
    }

    const tokenData = await response.json();
    toast({
      title: "Session Updated",
      description: "Your session has been successfully refreshed."
    });

    sessionStorage.setItem('azure_token', tokenData.access_token);
    sessionStorage.setItem('azure_refresh_token', tokenData.refresh_token);
    sessionStorage.setItem('azure_token_expiry', (Date.now() + (tokenData.expires_in * 1000)).toString());

    return true;
  } catch (error) {
    console.error('Error refreshing token:', error);
    toast({
      variant: "destructive",
      title: "Session Refresh Failed",
      description: error instanceof Error ? error.message : "Failed to refresh your session. Please sign in again."
    });
    return false;
  }
}

function generateRandomState(): string {
  return Math.random().toString(36).substring(2, 15) +
         Math.random().toString(36).substring(2, 15);
}
