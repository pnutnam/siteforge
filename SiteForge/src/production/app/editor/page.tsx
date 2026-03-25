'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { TiptapEditor } from '../../components/editor/tiptap-editor';
import { MobileAccordion } from '../../components/editor/mobile-accordion';
import { TemplatePicker } from '../../components/editor/template-picker';
import { PendingBanner } from '../../components/editor/pending-banner';
import { EmptyState } from '../../components/editor/empty-state';
import { ErrorState } from '../../components/editor/error-state';

interface Section {
  id: string;
  type: 'text' | 'image' | 'hero';
  content: Record<string, unknown>;
}

interface PageData {
  id: string;
  title: string;
  content: Record<string, unknown>;
  version: number;
  sections: Section[];
}

export default function EditorPage() {
  const router = useRouter();
  const [pageData, setPageData] = useState<PageData | null>(null);
  const [sections, setSections] = useState<Section[]>([]);
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

  // Decompose Tiptap JSON content into sections for MobileAccordion
  const decomposeContent = useCallback((content: Record<string, unknown>): Section[] => {
    if (!content || !content.content || !Array.isArray(content.content)) {
      return [];
    }

    const nodes = content.content as Array<Record<string, unknown>>;
    return nodes.map((node, index) => {
      const type = node.type as string;
      return {
        id: `section-${index}`,
        type: type === 'image' || type === 'hero' ? type : 'text',
        content: node,
      };
    });
  }, []);

  // Rebuild Tiptap JSON document from sections
  const rebuildContent = useCallback((updatedSections: Section[]): Record<string, unknown> => {
    return {
      type: 'doc',
      content: updatedSections.map((s) => s.content),
    };
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
        const decomposed = decomposeContent(data.content);
        setPageData(data);
        setSections(decomposed);
      } catch (error) {
        console.error('Failed to load page:', error);
        setHasError(true);
      } finally {
        setIsLoading(false);
      }
    };

    loadPage();
  }, [router, decomposeContent]);

  const handleSave = useCallback(async (content: Record<string, unknown>, version: number) => {
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

    if (response.ok) {
      const data = await response.json();
      // Update local version after successful save
      setPageData((prev) => prev ? { ...prev, version: data.version, content } : prev);
    }

    return { conflict: false };
  }, [pageData]);

  // Handle section content update — rebuild full doc and save
  const handleSectionUpdate = useCallback((sectionId: string, updatedContent: Record<string, unknown>) => {
    setSections((prev) => {
      const updated = prev.map((s) =>
        s.id === sectionId ? { ...s, content: updatedContent } : s
      );
      // Rebuild full page Tiptap doc from sections and save
      const fullContent = rebuildContent(updated);
      handleSave(fullContent, pageData?.version ?? 1);
      return updated;
    });
  }, [pageData?.version, handleSave, rebuildContent]);

  // Handle section reorder — reorder sections, rebuild doc, and save
  const handleSectionReorder = useCallback((fromIndex: number, toIndex: number) => {
    setSections((prev) => {
      const reordered = [...prev];
      const [moved] = reordered.splice(fromIndex, 1);
      reordered.splice(toIndex, 0, moved);
      const fullContent = rebuildContent(reordered);
      handleSave(fullContent, pageData?.version ?? 1);
      return reordered;
    });
  }, [pageData?.version, handleSave, rebuildContent]);

  // Handle image replace — TODO: needs S3 presigned URL flow (PROD-04 deferred)
  const handleImageReplace = useCallback((sectionId: string, file: File) => {
    console.warn('Image replace requires S3 presigned URL flow — not yet implemented');
    // Future: upload to S3, get URL, update section content with new src
  }, []);

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
  if (sections.length === 0) {
    return <EmptyState />;
  }

  // Mobile: section-by-section accordion
  if (isMobile) {
    return (
      <MobileAccordion
        sections={sections}
        onSectionUpdate={handleSectionUpdate}
        onSectionReorder={handleSectionReorder}
        onImageReplace={handleImageReplace}
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
