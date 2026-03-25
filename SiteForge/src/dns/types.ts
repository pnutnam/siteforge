// Custom domain record from database
export interface CustomDomain {
  id: string;
  tenantId: string;
  businessId: string;
  domain: string;
  cnameTarget: string;
  verificationStatus: 'pending' | 'verified' | 'failed';
  sslStatus: 'pending' | 'provisioned' | 'failed';
  sslCertificateId?: string;
  sslExpiresAt?: Date;
  verifiedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// CNAME validation result
export interface CnameValidation {
  isValid: boolean;
  resolvedTarget?: string;
  expectedTarget: string;
  checkedAt: Date;
}

// SSL certificate info from Cloudflare Origin
export interface OriginCertificate {
  id: string;
  certificate: string;
  private_key: string;
  expiresAt: Date;
}

// SSL provider interface (abstracts Let's Encrypt vs Cloudflare Origin)
export interface SSLProvider {
  provisionCertificate(domain: string, zoneId: string): Promise<OriginCertificate>;
  revokeCertificate(certificateId: string, zoneId: string): Promise<void>;
  isRenewalDue(expiresAt: Date, thresholdDays: number): boolean;
}

// Platform CNAME base domain
export const PLATFORM_CNAME_DOMAIN = 'cname.siteforge.io';
