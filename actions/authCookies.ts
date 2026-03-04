'use server';

import { parseJwtPayload } from '@/lib/helpers/auth-helpers';
import { AuthUserPayload } from '@/lib/types';
import { cookies } from 'next/headers';
import { revalidatePath } from 'next/cache';

type AuthCookieSession = {
  token: string | null;
  refreshToken: string | null;
  expiryTime: string | null;
};

type SetAuthCookiesInput = {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
};

export async function getAuthCookieSession(): Promise<AuthCookieSession> {
  const cookieStore = await cookies();

  return {
    token: cookieStore.get('azure_token')?.value || null,
    refreshToken: cookieStore.get('azure_refresh_token')?.value || null,
    expiryTime: cookieStore.get('azure_token_expiry')?.value || null,
  };
}

export async function setAuthCookies({
  accessToken,
  refreshToken,
  expiresIn,
}: SetAuthCookiesInput): Promise<void> {
  const cookieStore = await cookies();
  const expiresAt = new Date(Date.now() + expiresIn * 1000);

  const options = {
    expires: expiresAt,
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    path: '/',
  };

  cookieStore.set('azure_token', accessToken, options);
  cookieStore.set('azure_refresh_token', refreshToken, options);
  cookieStore.set('azure_token_expiry', expiresAt.getTime().toString(), options);
}

export async function getServerAuthSession(): Promise<{
  token: string | null;
  user: AuthUserPayload | null;
  expiryTime: string | null;
}> {
  const cookieStore = await cookies();
  const token = cookieStore.get('azure_token')?.value || null;
  const expiryTime = cookieStore.get('azure_token_expiry')?.value || null;
  const user = token ? parseJwtPayload(token) : null;
  return { token, user, expiryTime };
}

export async function revalidateAuthSession(): Promise<void> {
  revalidatePath('/', 'layout');
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();

  cookieStore.delete('azure_token');
  cookieStore.delete('azure_refresh_token');
  cookieStore.delete('azure_token_expiry');
}
