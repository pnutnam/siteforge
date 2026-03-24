export type AnalyticsEventType =
  | 'preview_sent'
  | 'preview_viewed'
  | 'cta_clicked'
  | 'form_opened'
  | 'form_submitted'
  | 'claimed'
  | 'paid';

export interface AnalyticsEvent {
  id: string;
  tenantId: string;
  businessId: string;
  previewLinkId: string;
  eventType: AnalyticsEventType;
  timestamp: Date;
  metadata?: Record<string, unknown>;  // e.g., { timeOnSite: 45, ctaPosition: 'hero' }
}

export interface PreviewAnalytics {
  previewLinkId: string;
  previewUrl: string;
  status: 'active' | 'expired' | 'claimed';
  daysUntilExpiration: number;
  events: {
    sent: number;
    viewed: number;
    ctaClicked: number;
    formOpened: number;
    formSubmitted: number;
    claimed: number;
    paid: number;
  };
  metrics: {
    viewRate: number;        // viewed / sent (CTR for open)
    clickRate: number;       // ctaClicked / viewed
    formOpenRate: number;    // formOpened / viewed
    conversionRate: number;  // formSubmitted / sent
  };
  timeOnSite?: {
    average: number;         // Average seconds on site
    median: number;
  };
  firstViewedAt?: Date;
  lastViewedAt?: Date;
}
