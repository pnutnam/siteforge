import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../database/pool';

interface RouteContext {
  params: Promise<{ id: string }>;
}

/**
 * GET /api/production/pages/:id
 * Fetch page content for editor.
 */
export async function GET(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    // Get tenant from session (header or cookie)
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const result = await pool.query(`
      SELECT id, tenant_id, business_id, title, slug, content, template_id, status, version, created_at, updated_at
      FROM payload_pages
      WHERE id = $1 AND tenant_id = $2
    `, [id, tenantId]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const page = result.rows[0];
    return NextResponse.json({
      id: page.id,
      title: page.title,
      slug: page.slug,
      content: page.content,
      templateId: page.template_id,
      status: page.status,
      version: page.version,
      createdAt: page.created_at,
      updatedAt: page.updated_at,
    });
  } catch (error) {
    console.error('Failed to fetch page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * PUT /api/production/pages/:id
 * Update page content (save action).
 */
export async function PUT(request: NextRequest, context: RouteContext) {
  const { id } = await context.params;

  try {
    const tenantId = request.headers.get('x-tenant-id');
    if (!tenantId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { content, version } = body;

    // Fetch current page to check version
    const currentResult = await pool.query(`
      SELECT version FROM payload_pages WHERE id = $1 AND tenant_id = $2
    `, [id, tenantId]);

    if (currentResult.rows.length === 0) {
      return NextResponse.json({ error: 'Page not found' }, { status: 404 });
    }

    const currentVersion = currentResult.rows[0].version;

    // Check for conflict
    if (version && version !== currentVersion) {
      return NextResponse.json({
        error: 'Version conflict',
        version: currentVersion,
      }, { status: 409 });
    }

    // Update page
    const updateResult = await pool.query(`
      UPDATE payload_pages
      SET content = $1,
          version = version + 1,
          updated_at = NOW()
      WHERE id = $2 AND tenant_id = $3
      RETURNING version
    `, [content, id, tenantId]);

    return NextResponse.json({
      success: true,
      version: updateResult.rows[0].version,
    });
  } catch (error) {
    console.error('Failed to update page:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
