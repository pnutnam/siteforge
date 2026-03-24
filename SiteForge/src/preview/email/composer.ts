/**
 * Email composer for dashboard - generates and sends preview emails.
 */

import { generateEmailCopy, GenerateEmailCopyOptions } from './ai-copy';
import { sendEmail } from './sender';
import { getPreviewLink } from '../links/manager';
import { pool } from '../../database/pool';

export interface ComposeEmailOptions extends GenerateEmailCopyOptions {
  toEmail: string;
  ownerName?: string;
}

export interface ComposedEmail {
  subject: string;
  body: string;
  previewUrl: string;
}

/**
 * Generate email copy for preview link.
 * Used by dashboard to show agent the AI-generated email before sending.
 */
export async function composeEmailPreview(options: ComposeEmailOptions): Promise<ComposedEmail> {
  const { subject, body } = await generateEmailCopy(options);

  return {
    subject,
    body,
    previewUrl: options.previewUrl,
  };
}

/**
 * Send the preview email to business owner.
 * Records the "sent" event for analytics.
 */
export async function sendPreviewEmail(options: ComposeEmailOptions): Promise<{ success: boolean; messageId: string }> {
  const { subject, body } = await generateEmailCopy(options);

  const result = await sendEmail({
    to: options.toEmail,
    from: options.agentEmail,
    subject,
    body,
  });

  // Record sent event
  const hash = options.previewUrl.split('/').pop() ?? '';
  const link = await getPreviewLink(hash);
  if (link) {
    await recordEmailSent(link.id, link.tenantId, link.businessId);
  }

  return result;
}

async function recordEmailSent(linkId: string, tenantId: string, businessId: string): Promise<void> {
  // Record analytics event for email sent
  await pool.query(
    `INSERT INTO analytics_events (tenant_id, business_id, preview_link_id, event_type, metadata, timestamp)
     VALUES ($1, $2, $3, 'preview_sent', '{}', NOW())`,
    [tenantId, businessId, linkId]
  );
  console.log(`[Email] Preview email sent for link ${linkId}`);
}
