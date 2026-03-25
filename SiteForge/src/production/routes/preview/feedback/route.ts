import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../database/pool';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const previewHash = searchParams.get('hash');

  if (!previewHash) {
    return NextResponse.json({ error: 'Preview hash required' }, { status: 400 });
  }

  try {
    // Look up preview link
    const linkResult = await pool.query(`
      SELECT pl.*, b.tenant_id, b.id as business_id
      FROM preview_links pl
      JOIN businesses b ON b.id = pl.business_id
      WHERE pl.url_hash = $1
    `, [previewHash]);

    if (linkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Preview not found' }, { status: 404 });
    }

    const link = linkResult.rows[0];

    // Get annotations for this preview
    const annotationsResult = await pool.query(`
      SELECT id, pin_x, pin_y, comment, status, created_at
      FROM feedback_annotations
      WHERE preview_link_id = $1
      ORDER BY created_at DESC
    `, [link.id]);

    return NextResponse.json({
      annotations: annotationsResult.rows.map(row => ({
        id: row.id,
        pinX: row.pin_x,
        pinY: row.pin_y,
        comment: row.comment,
        status: row.status,
        createdAt: row.created_at,
      })),
    });
  } catch (error) {
    console.error('Failed to fetch annotations:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      previewHash,
      tenantId,
      businessId,
      ownerAccountId,
      pinX,
      pinY,
      comment,
    } = body;

    if (!previewHash || !pinX || !pinY || !comment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
    }

    // Look up preview link
    const linkResult = await pool.query(`
      SELECT id FROM preview_links WHERE url_hash = $1
    `, [previewHash]);

    if (linkResult.rows.length === 0) {
      return NextResponse.json({ error: 'Preview not found' }, { status: 404 });
    }

    const previewLinkId = linkResult.rows[0].id;

    // Insert annotation
    const result = await pool.query(`
      INSERT INTO feedback_annotations
        (tenant_id, business_id, preview_link_id, owner_account_id, page_url, pin_x, pin_y, comment, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'open')
      RETURNING id
    `, [tenantId, businessId, previewLinkId, ownerAccountId, `/preview/${previewHash}`, pinX, pinY, comment]);

    return NextResponse.json({
      success: true,
      annotationId: result.rows[0].id,
    });
  } catch (error) {
    console.error('Failed to create annotation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
