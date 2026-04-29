import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const VALID_USERS: Record<string, string> = {
  denik: 'artcanchangetheworld',
};

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow login page, auth API, and iteration assets through
  if (pathname === '/' ||
      pathname.startsWith('/login') || 
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/designs') ||
      pathname.startsWith('/api/generate') ||  // Allow generation for testing
      pathname.startsWith('/api/pipeline') ||   // Allow pipeline API
      pathname.startsWith('/api/unsplash') ||   // Allow Unsplash API
      pathname.startsWith('/iterations') ||
      pathname.startsWith('/pipeline') ||       // Allow pipeline pages
      pathname.startsWith('/_next') || 
      pathname.startsWith('/favicon') ||
      pathname.startsWith('/icon') ||
      pathname.startsWith('/iterations/')) {
    return NextResponse.next();
  }

  // Allow iteration images
  if (pathname.startsWith('/iterations/')) {
    return NextResponse.next();
  }
  
  // Check for valid session cookie
  const session = request.cookies.get('denik_session');

  if (!session) {
    const loginUrl = new URL('/login', request.url);
    loginUrl.searchParams.set('next', pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Validate session value
  try {
    const payload = JSON.parse(atob(session.value));
    const now = Date.now();
    if (payload.exp && now > payload.exp) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('next', pathname);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('denik_session');
      return response;
    }
    if (!VALID_USERS[payload.user]) {
      const loginUrl = new URL('/login', request.url);
      const response = NextResponse.redirect(loginUrl);
      response.cookies.delete('denik_session');
      return response;
    }
  } catch {
    const loginUrl = new URL('/login', request.url);
    const response = NextResponse.redirect(loginUrl);
    response.cookies.delete('denik_session');
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
