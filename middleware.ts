import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;
  const { pathname } = request.nextUrl;

  const isAuthenticated = !!token;
  const isProtectedReportsRoute = pathname.startsWith('/raporty');

  if (!isAuthenticated && isProtectedReportsRoute) {
    const redirectUrl = new URL('/', request.url);
    redirectUrl.searchParams.set('auth', 'required');
    const response = NextResponse.redirect(redirectUrl);
    response.cookies.delete('access_token');
    return response;
  }

  const response = NextResponse.next();
  response.headers.set('x-pathname', pathname);
  return response;
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|.*\\..*).*)'],
};
