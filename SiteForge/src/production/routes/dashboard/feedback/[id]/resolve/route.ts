import { NextRequest, NextResponse } from 'next/server';
import { pool } from '../../../../../database/pool';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const resolvedParams = await params;
  const { id } = resolvedParams;

  try {
    // Get dev team account ID from session (TODO: implement dev team auth)
    const devTeamAccountId = 'dev-team-placeholder';

    const result = await pool.query(`
      UPDATE feedback_annotations
      SET status = 'resolved', resolved_at = NOW(), resolved_by = $1
      WHERE id = $2
      RETURNING id
    `, [devTeamAccountId, id]);

    if (result.rows.length === 0) {
      return NextResponse.json({ error: 'Annotation not found' }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Failed to resolve annotation:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
