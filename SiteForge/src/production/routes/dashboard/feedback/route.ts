import { NextResponse } from 'next/server';
import { pool } from '../../../database/pool';

// GET /api/production/dashboard/feedback - List all annotations
export async function GET() {
  try {
    const result = await pool.query(`
      SELECT
        fa.id,
        fa.pin_x,
        fa.pin_y,
        fa.comment,
        fa.status,
        fa.screenshot_url,
        fa.page_url,
        fa.created_at,
        fa.resolved_at,
        b.name as business_name,
        oa.email as owner_email,
        oa.id as owner_account_id
      FROM feedback_annotations fa
      JOIN businesses b ON b.id = fa.business_id
      JOIN owner_accounts oa ON oa.id = fa.owner_account_id
      ORDER BY fa.created_at DESC
    `);

    const annotations = result.rows.map(row => ({
      id: row.id,
      pinX: row.pin_x,
      pinY: row.pin_y,
      comment: row.comment,
      status: row.status,
      businessName: row.business_name,
      ownerEmail: row.owner_email,
      ownerName: row.owner_email.split('@')[0],  // Use email prefix as fallback name
      screenshotUrl: row.screenshot_url,
      pageUrl: row.page_url,
      createdAt: row.created_at,
      resolvedAt: row.resolved_at,
    }));

    return NextResponse.json({ annotations });
  } catch (error) {
    console.error('Failed to fetch annotations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
