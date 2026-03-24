export interface CreatePreviewLinkInput {
  tenantId: string;
  businessId: string;
  s3Key: string;
  expiresInDays?: number;  // Default 30
}

export interface PreviewLink {
  id: string;
  tenantId: string;
  businessId: string;
  urlHash: string;
  s3Key: string;
  status: 'active' | 'expired' | 'claimed';
  expiresAt: Date;
  createdAt: Date;
  viewedAt?: Date;
  viewCount: number;
  claimedAt?: Date;
}

export interface PreviewLinkStats {
  views: number;
  firstViewedAt?: Date;
  isExpired: boolean;
  daysUntilExpiration: number;
}