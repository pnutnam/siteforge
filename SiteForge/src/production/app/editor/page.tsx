'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { TiptapEditor } from '../../components/editor/tiptap-editor';
import { MobileAccordion } from '../../components/editor/mobile-accordion';
import { TemplatePicker } from '../../components/editor/template-picker';
import { PendingBanner } from '../../components/editor/pending-banner';
import { EmptyState } from '../../components/editor/empty-state';
import { ErrorState } from '../../components/editor/error-state';

interface PageData {
  id: string;
  title: string;
  content: Record<string, unknown>;
  version: number;
  sections: Array<{
    id: string;
    type: 'text' | 'image' | 'hero';
    content: Record<string, unknown>;
  }>;
}

export default function EditorPage() {
  const router = useRouter();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [accountStatus, setAccountStatus] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [showTemplatePicker, setShowTemplatePicker] = useState(false);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Load page data
  useEffect(() => {
    const loadPage = async () => {
      try {
        // Verify session
        const sessionResponse = await fetch('/api/production/session');
        if (!sessionResponse.ok) {
          router.push('/claim');
          return;
        }

        const sessionData = await sessionResponse.json();
        setAccountStatus(sessionData.status);

        // Load page data
        const pageResponse = await fetch(`/api/production/pages/${sessionData.businessId}`);
        if (!pageResponse.ok) {
          setShowTemplatePicker(true);
          return;
        }

        const data = await pageResponse.json();
        setPageData(data);
      } catch (error) {
        console.error('Failed to load page:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [router]);

  const handleSave = async (content: Record<string, unknown>, version: number) => {
    if (!pageData) return { conflict: false };

    const response = await fetch(`/api/production/pages/${pageData.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ content, version }),
    });

    if (response.status === 409) {
      const data = await response.json();
      return { conflict: true, serverVersion: data.version };
    }

    return { conflict: false };
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading...</div>
      </div>
    );
  }

  // Show error state if load failed
  if (hasError) {
    return <ErrorState onRetry={() => window.location.reload()} />;
  }

  // Show pending banner if account not yet enabled
  if (accountStatus === 'pending') {
    return <PendingBanner />;
  }

  // Show template picker if no page exists
  if (showTemplatePicker || !pageData) {
    return (
      <TemplatePicker
        templates={[]}  // TODO: Load from templates API
        onSelect={(id) => {
          setShowTemplatePicker(false);
          // Create new page with selected template
        }}
        onImportFromPreview={() => {
          // Handle import
        }}
      />
    );
  }

  // Show empty state when page has no sections
  if (!pageData.sections || pageData.sections.length === 0) {
    return <EmptyState />;
  }

  // Mobile: section-by-section accordion
  if (isMobile) {
    return (
      <MobileAccordion
        sections={pageData.sections}
        onSectionUpdate={(id, content) => {
          // Update local state
        }}
        onSectionReorder={(from, to) => {
          // Handle reorder
        }}
        onImageReplace={(id, file) => {
          // Upload and replace
        }}
        onSave={handleSave}
      />
    );
  }

  // Desktop: full WYSIWYG editor
  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-semibold mb-4" style={{ fontSize: '20px', fontWeight: 600 }}>
          {pageData.title}
        </h1>
        <TiptapEditor
          initialContent={pageData.content}
          pageId={pageData.id}
          businessId={pageData.id}
          onSave={handleSave}
          isMobile={false}
        />
      </div>
    </div>
  );
}
