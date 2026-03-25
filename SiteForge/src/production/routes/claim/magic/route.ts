import { NextRequest, NextResponse } from 'next/server';
import { verifyMagicLink } from '../../../auth/magic-link';
import { createSessionToken, getSessionCookieOptions } from '../../../auth/session';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const token = searchParams.get('token');

    if (!token) {
      return NextResponse.json(
        { success: false, message: 'Token required' },
        { status: 400 }
      );
    }

    const result = await verifyMagicLink(token);

    if (!result.valid || !result.accountId) {
      return NextResponse.json(
        { success: false, message: 'Invalid or expired magic link' },
        { status: 401 }
      );
    }

    // Create session
    const sessionToken = createSessionToken({
      accountId: result.accountId,
      tenantId: result.tenantId!,
      businessId: result.businessId!,
      email: result.email!,
      status: result.status as 'pending' | 'active' | 'disabled',
    });

    const response = NextResponse.json({
      success: true,
      message: 'Logged in successfully',
      status: result.status,
    });

    // Set session cookie
    response.cookies.set('sf_session', sessionToken, getSessionCookieOptions());

    // If pending, redirect to pending page
    if (result.status === 'pending') {
      response.cookies.set('sf_session', sessionToken, getSessionCookieOptions());
      return NextResponse.redirect(new URL('/pending', request.url));
    }

    // If active, redirect to editor
    if (result.status === 'active') {
      return NextResponse.redirect(new URL('/editor', request.url));
    }

    // If disabled, show error
    return NextResponse.json(
      { success: false, message: 'Account is disabled' },
      { status: 403 }
    );
  } catch (error) {
    console.error('Magic link verification error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
