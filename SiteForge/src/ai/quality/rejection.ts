/**
 * Rejection reason tracking for audit trail.
 * Provides structured logging of why content was filtered.
 */

export type RejectionSeverity = 'low' | 'medium' | 'high';

export interface RejectionReason {
  code: string;
  message: string;
  severity: RejectionSeverity;
  source: 'rule' | 'ai';
  timestamp: string;
}

export class RejectionTracker {
  private rejections: Map<string, RejectionReason[]> = new Map();

  addRejection(contentId: string, reason: Omit<RejectionReason, 'timestamp'>): void {
    const fullReason: RejectionReason = {
      ...reason,
      timestamp: new Date().toISOString(),
    };

    const existing = this.rejections.get(contentId) ?? [];
    existing.push(fullReason);
    this.rejections.set(contentId, existing);
  }

  getRejections(contentId: string): RejectionReason[] {
    return this.rejections.get(contentId) ?? [];
  }

  hasRejections(contentId: string): boolean {
    return this.rejections.has(contentId) && this.rejections.get(contentId)!.length > 0;
  }

  getAllRejections(): Map<string, RejectionReason[]> {
    return new Map(this.rejections);
  }

  clear(): void {
    this.rejections.clear();
  }

  // Get high-severity rejections for alerting
  getHighSeverityRejections(): Array<{ contentId: string; reason: RejectionReason }> {
    const results: Array<{ contentId: string; reason: RejectionReason }> = [];
    for (const [contentId, reasons] of this.rejections.entries()) {
      for (const reason of reasons) {
        if (reason.severity === 'high') {
          results.push({ contentId, reason });
        }
      }
    }
    return results;
  }
}

// Pre-defined rejection reason codes
export const REJECTION_CODES = {
  POST_TOO_OLD: 'POST_TOO_OLD',
  BANNED_HASHTAG: 'BANNED_HASHTAG',
  EXCESSIVE_HASHTAGS: 'EXCESSIVE_HASHTAGS',
  BANNED_KEYWORD: 'BANNED_KEYWORD',
  NO_IMAGE: 'NO_IMAGE',
  LOW_RESOLUTION: 'LOW_RESOLUTION',
  SCREENSHOT_DETECTED: 'SCREENSHOT_DETECTED',
  AI_QUALITY_LOW: 'AI_QUALITY_LOW',
  AI_OFF_BRAND: 'AI_OFF_BRAND',
} as const;
