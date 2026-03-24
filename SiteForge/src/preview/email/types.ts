export interface EmailComposerInput {
  businessName: string;
  businessOwnerName?: string;  // If known
  previewUrl: string;
  agentName: string;
  agentEmail: string;
}

export interface GeneratedEmail {
  subject: string;
  body: string;
  bodyHtml: string;  // HTML version for rich emails
}

export interface SendEmailInput {
  to: string;
  from: string;
  subject: string;
  body: string;
  bodyHtml?: string;
}
