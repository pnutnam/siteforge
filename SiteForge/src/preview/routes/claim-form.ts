/**
 * Claim form handler for preview pages.
 * Business owner fills out form to claim their preview -> triggers conversion event.
 */

import { pool } from '../../database/pool';
import { claimPreviewLink } from '../links/manager';
import { trackEvent } from '../analytics/tracker';

export interface ClaimFormData {
  previewHash: string;
  name: string;
  email: string;
  phone: string;
  currentWebsite?: string;
  description: string;
}

export interface ClaimFormResult {
  success: boolean;
  message: string;
  redirectUrl?: string;
}

/**
 * Handle claim form submission from preview page.
 * 1. Validate form data
 * 2. Mark preview as claimed
 * 3. Record conversion event
 * 4. Redirect to signup/claim flow
 */
export async function handleClaimForm(data: ClaimFormData): Promise<ClaimFormResult> {
  // Look up preview link
  const linkResult = await pool.query(
    `SELECT pl.*, b.name as business_name
     FROM preview_links pl
     JOIN businesses b ON b.id = pl.business_id
     WHERE pl.url_hash = $1`,
    [data.previewHash]
  );

  if (linkResult.rows.length === 0) {
    return { success: false, message: 'Preview not found' };
  }

  const link = linkResult.rows[0];

  // Check if expired
  if (new Date(link.expires_at) < new Date()) {
    return { success: false, message: 'This preview has expired. Please contact your sales agent.' };
  }

  // Check if already claimed
  if (link.status === 'claimed') {
    return { success: false, message: 'This preview has already been claimed.' };
  }

  // TODO (Phase 4): Store claim form data to claim_submissions table
  // This is Phase 4 territory per CONTEXT.md deferred ideas.
  // Currently we only track the conversion event without storing the form submission.
  // In Phase 4, this INSERT will be uncommented:
  // await pool.query(
  //   `INSERT INTO claim_submissions (preview_link_id, tenant_id, business_id, name, email, phone, current_website, description, submitted_at)
  //    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, NOW())
  //    ON CONFLICT (preview_link_id) DO UPDATE SET
  //      name = EXCLUDED.name,
  //      email = EXCLUDED.email,
  //      phone = EXCLUDED.phone,
  //      current_website = EXCLUDED.current_website,
  //      description = EXCLUDED.description,
  //      submitted_at = NOW()`,
  //   [link.id, link.tenant_id, link.business_id, data.name, data.email, data.phone, data.currentWebsite ?? null, data.description]
  // );

  // Mark preview as claimed
  await claimPreviewLink(data.previewHash);

  // Record conversion event
  await trackEvent({
    tenantId: link.tenant_id,
    businessId: link.business_id,
    previewLinkId: link.id,
    eventType: 'form_submitted',
    metadata: {
      ownerName: data.name,
      ownerEmail: data.email,
    },
  });

  // Redirect to signup flow (Phase 4 territory)
  return {
    success: true,
    message: 'Great! Redirecting you to set up your account...',
    redirectUrl: `/claim/${data.previewHash}/signup`,
  };
}
