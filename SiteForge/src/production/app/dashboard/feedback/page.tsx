'use client';

import { useEffect, useState } from 'react';
import { AnnotationList } from '../../../../components/dashboard/annotation-list';
import { AnnotationDetail } from '../../../../components/dashboard/annotation-detail';

interface Annotation {
  id: string;
  pinX: number;
  pinY: number;
  comment: string;
  status: 'open' | 'resolved';
  businessName: string;
  ownerEmail: string;
  ownerName: string;
  screenshotUrl?: string;
  pageUrl: string;
  createdAt: string;
  resolvedAt?: string;
}

export default function FeedbackDashboardPage() {
  const [annotations, setAnnotations] = useState<Annotation[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const loadAnnotations = async () => {
      try {
        const response = await fetch('/api/production/dashboard/feedback');
        if (!response.ok) throw new Error('Failed to load');
        const data = await response.json();
        setAnnotations(data.annotations);
      } catch (error) {
        console.error('Failed to load annotations:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadAnnotations();
  }, []);

  const handleResolve = async (id: string) => {
    try {
      const response = await fetch(`/api/production/dashboard/feedback/${id}/resolve`, {
        method: 'POST',
      });

      if (response.ok) {
        setAnnotations(annotations.map(a =>
          a.id === id ? { ...a, status: 'resolved' as const, resolvedAt: new Date().toISOString() } : a
        ));
      }
    } catch (error) {
      console.error('Failed to resolve annotation:', error);
    }
  };

  const handleContactOwner = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  const selectedAnnotation = annotations.find(a => a.id === selectedId);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-gray-500">Loading feedback...</div>
      </div>
    );
  }

  return (
    <div className="feedback-dashboard min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <h1 className="text-xl font-semibold" style={{ fontSize: '20px', fontWeight: 600 }}>
          Feedback Dashboard
        </h1>
        <p className="text-sm text-gray-500 mt-1" style={{ fontSize: '14px' }}>
          {annotations.filter(a => a.status === 'open').length} open · {annotations.length} total
        </p>
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* List */}
            <div>
              <AnnotationList
                annotations={annotations}
                onSelect={setSelectedId}
                selectedId={selectedId || undefined}
              />
            </div>

            {/* Detail */}
            <div>
              {selectedAnnotation ? (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-6">
                  <AnnotationDetail
                    {...selectedAnnotation}
                    onResolve={handleResolve}
                    onContactOwner={handleContactOwner}
                    onClose={() => setSelectedId(null)}
                  />
                </div>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
                  <div className="text-4xl mb-2">👆</div>
                  <p style={{ fontSize: '14px' }}>Select feedback to view details</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
