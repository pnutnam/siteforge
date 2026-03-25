import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../database/pool';
import { requireOwnership } from '@/auth/ownership';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  const tenantId = request.headers.get('x-tenant-id');
  const accountId = request.headers.get('x-account-id');
  if (!tenantId || !accountId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    // Fetch the annotation to verify tenant ownership
    const fetchResult = await pool.query(`
      SELECT tenant_id FROM feedback_annotations WHERE id = $1
    `, [id]);

    if (fetchResult.rows.length === 0) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 });
    }

    const annotationTenantId = fetchResult.rows[0].tenant_id;

    // Enforce ownership: JWT tenant must match annotation tenant
    requireOwnership(tenantId, annotationTenantId);

    const result = await pool.query(`
      UPDATE feedback_annotations
      SET status = 'resolved', resolved_at = NOW(), resolved_by = $1
      WHERE id = $2 AND tenant_id = $3
      RETURNING id
    `, [accountId, id, tenantId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to resolve annotation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
