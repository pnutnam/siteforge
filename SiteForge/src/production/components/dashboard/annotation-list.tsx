'use client';

import { useState } from 'react';
import { AnnotationCard } from './annotation-card';

interface Annotation {
  id: string;
  pinX: number;
  pinY: number;
  comment: string;
  status: 'open' | 'resolved';
  businessName: string;
  ownerEmail: string;
  screenshotUrl?: string;
  createdAt: string;
}

interface AnnotationListProps {
  annotations: Annotation[];
  onSelect: (id: string) => void;
  selectedId?: string;
}

export function AnnotationList({ annotations, onSelect, selectedId }: AnnotationListProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'resolved'>('all');

  const filtered = annotations.filter(a => {
    if (filter === 'all') return true;
    return a.status === filter;
  });

  return (
    <div className="annotation-list">
      {/* Filter controls */}
      <div className="flex gap-2 mb-4">
        {(['all', 'open', 'resolved'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`
              px-3 py-1.5 rounded text-sm font-medium transition-colors
              ${filter === f ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}
            `}
            style={{ fontSize: '14px' }}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
            {f !== 'all' && (
              <span className="ml-1 opacity-75">
                ({annotations.filter(a => a.status === f).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <div className="text-4xl mb-2">📝</div>
          <p style={{ fontSize: '14px' }}>
            {filter === 'all' ? 'No feedback yet' : `No ${filter} feedback`}
          </p>
        </div>
      ) : (
        <div className="flex flex-col gap-3">
          {filtered.map(annotation => (
            <AnnotationCard
              key={annotation.id}
              {...annotation}
              onClick={() => onSelect(annotation.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
