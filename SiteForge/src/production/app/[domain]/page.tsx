import { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { db } from '@/database/pool';
import { customDomains, businesses, payloadPages, payloadSiteSettings } from '@/database/schema';
import { eq, and } from 'drizzle-orm';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

interface ProductionPageProps {
  params: Promise<{ domain: string }>;
}

interface SiteSettings {
  siteName: string;
  tagline: string | null;
  contactEmail: string | null;
  contactPhone: string | null;
  address: string | null;
}

interface SitePage {
  id: string;
  title: string;
  slug: string;
  content: Record<string, unknown>;
  status: string;
  publishedAt: Date | null;
}

interface SiteBusiness {
  id: string;
  name: string;
  tenantId: string;
}

interface ProductionContent {
  page: SitePage;
  settings: SiteSettings;
  business: SiteBusiness;
}

/**
 * Production site page - serves published content for a business domain.
 * Uses ISR for CDN caching with on-demand revalidation on content changes.
 */
export async function generateMetadata({ params }: ProductionPageProps): Promise<Metadata> {
  const { domain } = await params;
  const business = await getBusinessByDomain(domain);

  if (!business) {
    return { title: 'Site Not Found' };
  }

  const settings = await getSiteSettings(business.id, business.tenantId);

  return {
    title: settings?.siteName || business.name,
    description: settings?.tagline || `Official website for ${business.name}`,
  };
}

export default async function ProductionPage({ params }: ProductionPageProps) {
  const { domain } = await params;

  const business = await getBusinessByDomain(domain);
  if (!business) {
    notFound();
  }

  const content = await getProductionContent(domain);
  if (!content) {
    notFound();
  }

  const { page, settings } = content;

  return (
    <div className="production-site min-h-screen">
      {/* Header */}
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <a href="/" className="text-xl font-semibold" style={{ fontSize: '20px', fontWeight: 600 }}>
            {settings?.siteName || business.name}
          </a>
        </div>
      </header>

      {/* Main content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <TiptapRenderer content={page.content} />
      </main>

      {/* Footer */}
      <footer className="bg-gray-50 border-t border-gray-200 mt-16">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="text-sm text-gray-500">
            {settings?.contactEmail && (
              <div className="mb-2">
                <a href={`mailto:${settings.contactEmail}`} className="hover:text-gray-700">
                  {settings.contactEmail}
                </a>
              </div>
            )}
            {settings?.contactPhone && (
              <div className="mb-2">
                <a href={`tel:${settings.contactPhone}`} className="hover:text-gray-700">
                  {settings.contactPhone}
                </a>
              </div>
            )}
            {settings?.address && (
              <div className="mb-2">{settings.address}</div>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
}

/**
 * Render Tiptap JSON content as React components.
 * Uses @tiptap/react renderers in client component.
 */
function TiptapRenderer({ content }: { content: Record<string, unknown> }) {
  return (
    <div
      className="prose prose-lg max-w-none"
      dangerouslySetInnerHTML={{
        __html: tiptapToHtml(content),
      }}
    />
  );
}

/**
 * Convert Tiptap JSON to HTML string for SSR.
 */
function tiptapToHtml(content: Record<string, unknown>): string {
  if (!content || !content.type) return '';

  const contentJson = content as { type: string; content?: unknown[] };

  const renderNode = (node: unknown): string => {
    if (!node || typeof node !== 'object') return '';
    const n = node as { type: string; text?: string; content?: unknown[]; attrs?: Record<string, unknown> };

    switch (n.type) {
      case 'doc':
        return (n.content || []).map(renderNode).join('');
      case 'paragraph':
        return `<p>${(n.content || []).map(renderNode).join('')}</p>`;
      case 'heading':
        const level = (n.attrs?.level as number) || 1;
        return `<h${level}>${(n.content || []).map(renderNode).join('')}</h${level}>`;
      case 'text':
        return n.text || '';
      case 'bold':
        return `<strong>${(n.content || []).map(renderNode).join('')}</strong>`;
      case 'italic':
        return `<em>${(n.content || []).map(renderNode).join('')}</em>`;
      case 'underline':
        return `<u>${(n.content || []).map(renderNode).join('')}</u>`;
      case 'image': {
        const src = (n.attrs?.src as string) || '';
        return `<img src="${src}" alt="" class="w-full h-auto" />`;
      }
      case 'bulletList':
        return `<ul>${(n.content || []).map(renderNode).join('')}</ul>`;
      case 'orderedList':
        return `<ol>${(n.content || []).map(renderNode).join('')}</ol>`;
      case 'listItem':
        return `<li>${(n.content || []).map(renderNode).join('')}</li>`;
      case 'blockquote':
        return `<blockquote>${(n.content || []).map(renderNode).join('')}</blockquote>`;
      case 'codeBlock':
        return `<pre><code>${(n.content || []).map(renderNode).join('')}</code></pre>`;
      case 'horizontalRule':
        return '<hr />';
      default:
        return (n.content || []).map(renderNode).join('');
    }
  };

  return renderNode(contentJson);
}

/**
 * Look up business by domain.
 * Resolves custom domain -> tenantId + businessId -> business record.
 */
async function getBusinessByDomain(domain: string): Promise<SiteBusiness | null> {
  // Look up verified custom domain
  const domainResult = await db
    .select({
      businessId: customDomains.businessId,
      tenantId: customDomains.tenantId,
    })
    .from(customDomains)
    .where(
      and(
        eq(customDomains.domain, domain),
        eq(customDomains.verificationStatus, 'verified')
      )
    )
    .limit(1);

  if (domainResult.length === 0) {
    return null;
  }

  const { businessId, tenantId } = domainResult[0];

  // Fetch business record
  const businessResult = await db
    .select({
      id: businesses.id,
      name: businesses.name,
      tenantId: businesses.tenantId,
    })
    .from(businesses)
    .where(eq(businesses.id, businessId))
    .limit(1);

  if (businessResult.length === 0) {
    return null;
  }

  return businessResult[0];
}

/**
 * Get site settings for a business.
 */
async function getSiteSettings(businessId: string, tenantId: string): Promise<SiteSettings | null> {
  const result = await db
    .select({
      siteName: payloadSiteSettings.siteName,
      tagline: payloadSiteSettings.tagline,
      contactEmail: payloadSiteSettings.contactEmail,
      contactPhone: payloadSiteSettings.contactPhone,
      address: payloadSiteSettings.address,
    })
    .from(payloadSiteSettings)
    .where(
      and(
        eq(payloadSiteSettings.businessId, businessId),
        eq(payloadSiteSettings.tenantId, tenantId)
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}

/**
 * Get published page content for a business.
 */
async function getPublishedPage(businessId: string, tenantId: string): Promise<SitePage | null> {
  const result = await db
    .select({
      id: payloadPages.id,
      title: payloadPages.title,
      slug: payloadPages.slug,
      content: payloadPages.content,
      status: payloadPages.status,
      publishedAt: payloadPages.publishedAt,
    })
    .from(payloadPages)
    .where(
      and(
        eq(payloadPages.businessId, businessId),
        eq(payloadPages.tenantId, tenantId),
        eq(payloadPages.status, 'published')
      )
    )
    .limit(1);

  if (result.length === 0) {
    return null;
  }

  return result[0];
}

/**
 * Get production content: published page + settings for a domain.
 */
async function getProductionContent(domain: string): Promise<ProductionContent | null> {
  const business = await getBusinessByDomain(domain);
  if (!business) {
    return null;
  }

  const [page, settings] = await Promise.all([
    getPublishedPage(business.id, business.tenantId),
    getSiteSettings(business.id, business.tenantId),
  ]);

  if (!page) {
    return null;
  }

  return {
    page,
    settings: settings || {
      siteName: business.name,
      tagline: null,
      contactEmail: null,
      contactPhone: null,
      address: null,
    },
    business,
  };
}
