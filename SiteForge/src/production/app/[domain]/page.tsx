import { Metadata } from 'next';
import { notFound } from 'next/navigation';

// ISR: Revalidate every 60 seconds
export const revalidate = 60;

interface ProductionPageProps {
  params: Promise<{ domain: string }>;
}

/**
 * Production site page - serves published content for a business domain.
 * Uses ISR for CDN caching with on-demand revalidation on content changes.
 */
export async function generateMetadata({ params }: ProductionPageProps): Promise<Metadata> {
  const { domain } = await params;

  // Look up business by domain (or custom domain)
  const business = await getBusinessByDomain(domain);

  if (!business) {
    return { title: 'Site Not Found' };
  }

  return {
    title: business.siteName || business.businessName,
    description: business.tagline || `Official website for ${business.businessName}`,
  };
}

export default async function ProductionPage({ params }: ProductionPageProps) {
  const { domain } = await params;

  // Look up business and published page
  const data = await getProductionContent(domain);

  if (!data) {
    notFound();
  }

  const { page, settings, business } = data;

  // Render page content from Tiptap JSON
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
  // For SSR, we render the HTML output directly
  // Client-side TiptapEditor handles editing
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

  // Basic Tiptap JSON to HTML conversion
  // In production, use @tiptap/html package
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
      case 'image':
        const src = (n.attrs?.src as string) || '';
        return `<img src="${src}" alt="" class="w-full h-auto" />`;
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

async function getBusinessByDomain(domain: string) {
  // TODO: Implement domain lookup
  // Query businesses table joined with custom domains
  return null;
}

async function getProductionContent(domain: string) {
  // TODO: Implement content lookup
  // 1. Look up business by domain
  // 2. Query Payload pages for published page under business
  // 3. Query Payload site-settings for business settings
  return null;
}
