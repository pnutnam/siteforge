import { NextRequest, NextResponse } from 'next/server';
import { verifyAccessToken } from '@/auth/jwt';

const PUBLIC_PATHS = [
  '/api/auth/setup-2fa',
  '/api/auth/verify-2fa',
  '/api/auth/2fa-status',
  '/claim/magic',
];

const STATIC_PATHS = ['/_next/static', '/_next/image', '/favicon.ico'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip public paths
  if (PUBLIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Skip static assets
  if (STATIC_PATHS.some(p => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Extract token from cookie or header
  const token = request.cookies.get('sf_session')?.value
    || request.headers.get('authorization')?.replace('Bearer ', '');

  if (!token) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyAccessToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 });
  }

  // Forward tenant context to API routes
  const headers = new Headers(request.headers);
  headers.set('x-tenant-id', payload.tenantId);
  headers.set('x-account-id', payload.accountId);

  return NextResponse.next({ request: { headers } });
}

export const config = {
  matcher: ['/api/:path*', '/dashboard/:path*'],
};
