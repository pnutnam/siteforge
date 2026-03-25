import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../database/pool';
import { requireOwnership } from '@/auth/ownership';

// GET /api/production/dashboard/feedback - List annotations for tenant
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Use tenant isolation - only return feedback for this tenant
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
      WHERE fa.tenant_id = $1
      ORDER BY fa.created_at DESC
    `, [tenantId]);

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
