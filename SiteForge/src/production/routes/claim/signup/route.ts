import { NextRequest, NextResponse } from 'next/server';
import { createMagicLink, getMagicLinkUrl } from '../../../auth/magic-link';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { previewHash, email } = body;

    if (!email || !previewHash) {
      return NextResponse.json(
        { success: false, message: 'Email and preview hash required' },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, message: 'Invalid email format' },
        { status: 400 }
      );
    }

    // Look up preview link to get tenant and business IDs
    const { pool } = await import('../../database/pool');
    const linkResult = await pool.query(`
      SELECT pl.*, b.tenant_id, b.id as business_id
      FROM preview_links pl
      JOIN businesses b ON b.id = pl.business_id
      WHERE pl.url_hash = $1
    `, [previewHash]);

    if (linkResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, message: 'Preview not found' },
        { status: 404 }
      );
    }

    const link = linkResult.rows[0];

    // Check if expired or already claimed
    if (link.status === 'expired') {
      return NextResponse.json(
        { success: false, message: 'This preview has expired' },
        { status: 410 }
      );
    }

    // Create magic link
    const result = await createMagicLink(link.tenant_id, link.business_id, email);

    if (!result.success || !result.token) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: 500 }
      );
    }

    // In production, send email via SendGrid
    const magicLinkUrl = getMagicLinkUrl(result.token);

    // TODO: Send email via SendGrid
    // await sendMagicLinkEmail(email, magicLinkUrl);

    console.log(`Magic link for ${email}: ${magicLinkUrl}`);

    return NextResponse.json({
      success: true,
      message: 'Magic link sent to your email',
      // For development, return the URL directly
      ...(process.env.NODE_ENV !== 'production' && { debugUrl: magicLinkUrl }),
    });
  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { success: false, message: 'Something went wrong. Please try again.' },
      { status: 500 }
    );
  }
}
