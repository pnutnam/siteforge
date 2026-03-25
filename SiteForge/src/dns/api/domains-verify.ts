import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database';
import { customDomains } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { checkCnameValidation, getZoneId } from '@/dns/validation';
import { createSSLProvider } from '@/dns/ssl-provider';

// POST /api/domains/verify - Verify CNAME and provision SSL
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { domainId } = body;

  if (!domainId) {
    return NextResponse.json({ error: 'domainId is required' }, { status: 400 });
  }

  // Get domain record
  const [domain] = await db
    .select()
    .from(customDomains)
    .where(and(
      eq(customDomains.id, domainId),
      eq(customDomains.tenantId, tenantId)
    ))
    .limit(1);

  if (!domain) {
    return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
  }

  // Step 1: Verify CNAME matches expected target
  const validation = await checkCnameValidation(domain.domain, domain.cnameTarget);

  if (!validation.isValid) {
    // Update status to failed
    await db
      .update(customDomains)
      .set({
        verificationStatus: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(customDomains.id, domainId));

    return NextResponse.json({
      success: false,
      error: 'CNAME validation failed',
      details: {
        expected: domain.cnameTarget,
        resolved: validation.resolvedTarget,
      }
    }, { status: 400 });
  }

  // Step 2: CNAME verified - update status and provision SSL
  await db
    .update(customDomains)
    .set({
      verificationStatus: 'verified',
      verifiedAt: new Date(),
      sslStatus: 'pending',
      updatedAt: new Date(),
    })
    .where(eq(customDomains.id, domainId));

  // Step 3: Provision SSL certificate
  const sslProvider = createSSLProvider();
  const zoneId = await getZoneId(domain.domain);

  if (!zoneId) {
    await db
      .update(customDomains)
      .set({
        sslStatus: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(customDomains.id, domainId));

    return NextResponse.json({
      success: false,
      error: 'Could not determine Cloudflare zone for domain',
    }, { status: 400 });
  }

  try {
    const certificate = await sslProvider.provisionCertificate(domain.domain, zoneId);

    await db
      .update(customDomains)
      .set({
        sslStatus: 'provisioned',
        sslCertificateId: certificate.id,
        sslExpiresAt: certificate.expiresAt,
        updatedAt: new Date(),
      })
      .where(eq(customDomains.id, domainId));

    return NextResponse.json({
      success: true,
      domain: {
        ...domain,
        verificationStatus: 'verified',
        sslStatus: 'provisioned',
        sslExpiresAt: certificate.expiresAt,
      }
    });
  } catch (error) {
    await db
      .update(customDomains)
      .set({
        sslStatus: 'failed',
        updatedAt: new Date(),
      })
      .where(eq(customDomains.id, domainId));

    return NextResponse.json({
      success: false,
      error: 'SSL certificate provisioning failed',
    }, { status: 500 });
  }
}
