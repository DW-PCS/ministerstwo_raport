'use server';

import { cookies } from 'next/headers';

export async function getAuthCookieSession(): Promise<{ token: string | null }> {
  const cookieStore = await cookies();
  return {
    token: cookieStore.get('access_token')?.value || null,
  };
}

export async function getServerAuthSession(): Promise<{ token: string | null }> {
  const cookieStore = await cookies();
  const token = cookieStore.get('access_token')?.value || null;
  return { token };
}

export async function clearAuthCookies(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('access_token');
}
