import sgMail from '@sendgrid/mail';
import { SendEmailInput } from './types';

// Initialize with API key from environment
if (process.env.SENDGRID_API_KEY) {
  sgMail.setApiKey(process.env.SENDGRID_API_KEY);
}

export async function sendEmail(input: SendEmailInput): Promise<{ success: boolean; messageId: string }> {
  if (!process.env.SENDGRID_API_KEY) {
    console.warn('[Email] SENDGRID_API_KEY not set - falling back to console log');
    console.log(`[Email] Would send to ${input.to}: ${input.subject}`);
    return { success: true, messageId: `no-api-key-${Date.now()}` };
  }

  try {
    const [response] = await sgMail.send({
      to: input.to,
      from: input.from,
      subject: input.subject,
      text: input.body,
      html: input.bodyHtml ?? input.body,
    });

    const messageId = response.headers['x-message-id'] as string ?? `sg-${Date.now()}`;
    console.log(`[Email] Sent to ${input.to}, messageId: ${messageId}`);

    return { success: true, messageId };
  } catch (error) {
    console.error('[Email] Send failed:', error);
    throw error;
  }
}
