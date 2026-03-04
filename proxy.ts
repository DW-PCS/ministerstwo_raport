import { getTokenRemainingSeconds, isValidToken } from '@/lib/token';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function proxy(request: NextRequest) {
  const token = request.cookies.get('azure_token')?.value;
  const { pathname } = request.nextUrl;
  const remainingSeconds = token ? getTokenRemainingSeconds(token) : null;

  const isTokenExpired = !!token && remainingSeconds !== null && remainingSeconds <= 0;

  const isProtectedReportsRoute = pathname.startsWith('/reports');

  const isAuthenticated =
    !!token && (await isValidToken(token)) && remainingSeconds !== null && remainingSeconds > 0;

  if (!isAuthenticated && isProtectedReportsRoute) {
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('auth', 'required');
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('azure_token');
    response.cookies.delete('azure_refresh_token');
    response.cookies.delete('azure_token_expiry');
    return response;
  }

  if (isAuthenticated && pathname.startsWith('/auth/azure-ad')) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);

  if (isTokenExpired) {
    response.cookies.delete('azure_token');
    response.cookies.delete('azure_refresh_token');
    response.cookies.delete('azure_token_expiry');
  }

  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
