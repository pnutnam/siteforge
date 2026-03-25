'use client';

import { useState } from 'react';
import { TiptapEditor } from './tiptap-editor';
import { ImageReplacer } from './image-replacer';
import { SectionDragHandle } from './section-drag-handle';

interface Section {
  id: string;
  type: 'text' | 'image' | 'hero';
  content: Record<string, unknown>;
}

interface MobileAccordionProps {
  sections: Section[];
  onSectionUpdate: (sectionId: string, content: Record<string, unknown>) => void;
  onSectionReorder: (fromIndex: number, toIndex: number) => void;
  onImageReplace: (sectionId: string, file: File) => void;
  onSave: (content: Record<string, unknown>, version: number) => Promise<{ conflict?: boolean; serverVersion?: number }>;
}

export function MobileAccordion({
  sections,
  onSectionUpdate,
  onSectionReorder,
  onImageReplace,
  onSave,
}: MobileAccordionProps) {
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const handleToggle = (sectionId: string) => {
    setExpandedId(expandedId === sectionId ? null : sectionId);
  };

  return (
    <div className="mobile-accordion flex flex-col gap-2 p-4">
      {sections.map((section, index) => (
        <div key={section.id} className="accordion-item border border-gray-200 rounded-lg bg-white overflow-hidden">
          {/* Section header - always visible */}
          <div className="flex items-center gap-2 p-3 bg-gray-50">
            <SectionDragHandle sectionId={section.id} index={index} onReorder={onSectionReorder} />
            <button
              onClick={() => handleToggle(section.id)}
              className="flex-1 text-left flex items-center justify-between"
              aria-expanded={expandedId === section.id}
            >
              <span className="font-medium text-gray-900 capitalize" style={{ fontSize: '14px', fontWeight: 500 }}>
                {section.type} Section
              </span>
              <span className={`transform transition-transform ${expandedId === section.id ? 'rotate-180' : ''}`}>
                ▼
              </span>
            </button>
          </div>

          {/* Expanded content - one at a time */}
          {expandedId === section.id && (
            <div className="p-3 border-t border-gray-100">
              {section.type === 'text' && (
                <TiptapEditor
                  initialContent={section.content}
                  pageId={section.id}
                  businessId=""
                  onSave={(content) => {
                    onSectionUpdate(section.id, content);
                    return onSave(content, 1);
                  }}
                  isMobile={true}
                />
              )}
              {section.type === 'image' && (
                <ImageReplacer
                  currentSrc={(section.content.src as string) || ''}
                  onReplace={(file) => onImageReplace(section.id, file)}
                  businessId=""
                />
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
