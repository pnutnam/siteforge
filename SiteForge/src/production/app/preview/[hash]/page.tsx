'use client';

import { useEffect, useState, use } from 'react';
import { AnnotationOverlay } from '../../../../components/feedback/annotation-overlay';

interface PreviewPageProps {
  params: Promise<{ hash: string }>;
}

export default function PreviewPage({ params }: PreviewPageProps) {
  const resolvedParams = use(params);
  const { hash } = resolvedParams;
  const [previewData, setPreviewData] = useState<{
    html: string;
    businessName: string;
    tenantId: string;
    businessId: string;
  } | null>(null);
  const [annotationMode, setAnnotationMode] = useState(false);
  const [annotations, setAnnotations] = useState<Array<{
    id: string;
    pinX: number;
    pinY: number;
    comment: string;
    status: 'open' | 'resolved';
  }>>([]);
  const [ownerAccountId, setOwnerAccountId] = useState<string | null>(null);

  // Load preview data
  useEffect(() => {
    const loadPreview = async () => {
      try {
        // Get preview content from S3/CDN
        const previewRes = await fetch(`/api/production/preview/${hash}`);
        if (!previewRes.ok) {
          throw new Error('Preview not found');
        }
        const data = await previewRes.json();
        setPreviewData(data);

        // Load existing annotations
        const annotationsRes = await fetch(`/api/production/feedback/${hash}`);
        if (annotationsRes.ok) {
          const annotationsData = await annotationsRes.json();
          setAnnotations(annotationsData.annotations || []);
        }

        // Check if owner is logged in
        const sessionRes = await fetch('/api/production/session');
        if (sessionRes.ok) {
          const sessionData = await sessionRes.json();
          setOwnerAccountId(sessionData.accountId);
        }
      } catch (error) {
        console.error('Failed to load preview:', error);
      }
    };

    loadPreview();
  }, [hash]);

  const handleSubmitAnnotation = async (data: { pinX: number; pinY: number; comment: string }) => {
    if (!previewData || !ownerAccountId) return;

    const response = await fetch('/api/production/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        previewHash: hash,
        tenantId: previewData.tenantId,
        businessId: previewData.businessId,
        ownerAccountId,
        ...data,
      }),
    });

    if (!response.ok) {
      throw new Error('Failed to submit feedback');
    }
  };

  if (!previewData) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading preview...</div>
      </div>
    );
  }

  return (
    <div className="preview-page relative">
      {/* Preview content iframe/container */}
      <div
        className="preview-content"
        dangerouslySetInnerHTML={{ __html: previewData.html }}
      />

      {/* Annotation overlay */}
      <div className="absolute inset-0">
        <AnnotationOverlay
          previewHash={hash}
          businessId={previewData.businessId}
          tenantId={previewData.tenantId}
          ownerAccountId={ownerAccountId || ''}
          annotations={annotations}
          onSubmit={handleSubmitAnnotation}
          enabled={annotationMode}
        />
      </div>

      {/* Action bar */}
      {ownerAccountId && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4">
          <div className="max-w-4xl mx-auto flex gap-3">
            <button
              onClick={() => setAnnotationMode(!annotationMode)}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                annotationMode
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              {annotationMode ? 'Cancel Annotation' : 'Send Feedback'}
            </button>
            <button
              onClick={() => window.location.href = '/editor'}
              className="flex-1 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
              style={{ fontSize: '14px', fontWeight: 600 }}
            >
              Edit Page
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
