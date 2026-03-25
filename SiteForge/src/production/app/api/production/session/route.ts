import { NextRequest, NextResponse } from 'next/server';
import { verifySessionToken } from '../../../../components/auth/session';

export async function GET(request: NextRequest) {
  // Get session cookie
  const sessionCookie = request.cookies.get('sf_session')?.value;

  if (!sessionCookie) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  const session = verifySessionToken(sessionCookie);

  if (!session) {
    return NextResponse.json({ authenticated: false }, { status: 401 });
  }

  return NextResponse.json({
    authenticated: true,
    accountId: session.accountId,
    tenantId: session.tenantId,
    businessId: session.businessId,
    email: session.email,
    status: session.status,
  });
}
