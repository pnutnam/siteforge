import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/database';
import { customDomains } from '@/database/schema';
import { eq, and } from 'drizzle-orm';
import { generateCnameTarget } from '@/dns/validation';

// GET /api/domains - List custom domains for authenticated tenant
export async function GET(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const domains = await db
    .select()
    .from(customDomains)
    .where(eq(customDomains.tenantId, tenantId));

  return NextResponse.json({ domains });
}

// POST /api/domains - Add a new custom domain
export async function POST(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const body = await request.json();
  const { domain } = body;

  if (!domain || typeof domain !== 'string') {
    return NextResponse.json({ error: 'domain is required' }, { status: 400 });
  }

  // Check if domain already exists for this tenant
  const existing = await db
    .select()
    .from(customDomains)
    .where(and(
      eq(customDomains.domain, domain),
      eq(customDomains.tenantId, tenantId)
    ))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ error: 'Domain already registered' }, { status: 409 });
  }

  // Get tenant ID shortened for CNAME target
  const cnameTarget = generateCnameTarget(tenantId);

  // Insert pending domain record
  const [newDomain] = await db
    .insert(customDomains)
    .values({
      tenantId,
      businessId: tenantId, // In production, get actual businessId
      domain,
      cnameTarget,
      verificationStatus: 'pending',
      sslStatus: 'pending',
    })
    .returning();

  return NextResponse.json({
    domain: newDomain,
    instructions: {
      type: 'CNAME',
      record: domain,
      target: cnameTarget,
      hint: `Add a CNAME record: ${domain} CNAME ${cnameTarget}`,
    }
  }, { status: 201 });
}

// DELETE /api/domains - Remove a custom domain
export async function DELETE(request: NextRequest) {
  const tenantId = request.headers.get('x-tenant-id');
  if (!tenantId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const domainId = searchParams.get('id');

  if (!domainId) {
    return NextResponse.json({ error: 'id is required' }, { status: 400 });
  }

  // Verify domain belongs to this tenant
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

  await db
    .delete(customDomains)
    .where(eq(customDomains.id, domainId));

  return NextResponse.json({ success: true });
}
