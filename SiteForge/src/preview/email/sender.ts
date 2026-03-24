/**
 * Email sending via external provider.
 * Currently a stub - integrates with SendGrid/AWS SES.
 */

import { SendEmailInput } from './types';

export async function sendEmail(input: SendEmailInput): Promise<{ success: boolean; messageId: string }> {
  // TODO: Implement actual email sending
  // Options: SendGrid (@sendgrid/mail), AWS SES (@aws-sdk/client-ses)

  console.log(`[Email] Would send to ${input.to}: ${input.subject}`);

  // Stub implementation - returns success
  return {
    success: true,
    messageId: `stub-${Date.now()}`,
  };
}
