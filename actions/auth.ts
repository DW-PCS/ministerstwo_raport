'use server';

import { SESSION_TIMEOUT_SECONDS } from '@/constants';
import { loginUser } from '@/lib/api/reportApiService';
import { cookies } from 'next/headers';

export async function loginAction(username: string, password: string): Promise<{ success: boolean; error?: string }> {
  try {
    const data = await loginUser(username, password);
    const cookieStore = await cookies();
    cookieStore.set('access_token', data.access_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: SESSION_TIMEOUT_SECONDS,
    });
    return { success: true };
  } catch {
    return { success: false, error: 'Nieprawidłowe dane logowania' };
  }
}

export async function logoutAction(): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.delete('access_token');
}
