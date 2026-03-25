import { NextRequest, NextResponse } from 'next/server';
import { revalidatePage } from '../../../../cdn/revalidator';

/**
 * Payload CMS webhook endpoint for on-demand revalidation.
 * Payload calls this after content is published/updated.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { secret, slug, operation } = body;

    // Verify webhook secret
    if (secret !== process.env.PAYLOAD_WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only revalidate on publish/unpublish operations
    if (operation === 'publish' || operation === 'unpublish') {
      if (!slug) {
        return NextResponse.json({ error: 'Slug required' }, { status: 400 });
      }

      const result = await revalidatePage(slug);

      return NextResponse.json({
        success: result.success,
        pagesRevalidated: result.pagesRevalidated,
        errors: result.errors,
      });
    }

    return NextResponse.json({ message: 'No revalidation needed' });
  } catch (error) {
    console.error('Payload webhook error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
