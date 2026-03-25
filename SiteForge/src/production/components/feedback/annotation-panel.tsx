'use client';

import { useState, useRef, useEffect } from 'react';

interface AnnotationPanelProps {
  comment?: string;
  onSubmit: (comment: string) => Promise<void>;
  onCancel: () => void;
  positionX: number;
  positionY: number;
  readOnly?: boolean;
}

export function AnnotationPanel({
  comment = '',
  onSubmit,
  onCancel,
  positionX,
  positionY,
  readOnly = false,
}: AnnotationPanelProps) {
  const [text, setText] = useState(comment);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (!readOnly && textareaRef.current) {
      textareaRef.current.focus();
    }
  }, [readOnly]);

  // Position panel near pin but avoid edge overflow
  const getPosition = () => {
    const panelWidth = 280;
    const panelHeight = 160;
    const margin = 16;

    let left = positionX;
    let top = positionY + 5; // Below pin

    // Flip to left if would overflow right edge
    if (left + 10 + panelWidth / 2 > 100) {
      left = left - 15;
    } else {
      left = left + 5;
    }

    // Flip above if would overflow bottom
    if (top + panelHeight > 95) {
      top = positionY - panelHeight - 5;
    }

    return { left: `${left}%`, top: `${top}%` };
  };

  const pos = getPosition();

  const handleSubmit = async () => {
    if (!text.trim() || isSubmitting) return;

    setIsSubmitting(true);
    try {
      await onSubmit(text.trim());
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="annotation-panel absolute bg-white rounded-lg shadow-xl border border-gray-200 p-4 w-70 z-20"
      style={{
        left: pos.left,
        top: pos.top,
        minWidth: '260px',
        maxWidth: '320px',
      }}
    >
      {!readOnly && (
        <>
          <div className="text-sm font-medium text-gray-700 mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
            Add your feedback
          </div>
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Describe what needs to be changed..."
            className="w-full border border-gray-200 rounded p-2 text-sm resize-none focus:outline-none focus:border-blue-400"
            style={{ fontSize: '14px', lineHeight: 1.5 }}
            rows={3}
          />
          <div className="flex gap-2 mt-3 justify-end">
            <button
              onClick={onCancel}
              className="px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm transition-colors"
              style={{ fontSize: '14px', fontWeight: 500 }}
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={!text.trim() || isSubmitting}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded text-sm transition-colors disabled:opacity-50"
              style={{ fontSize: '14px', fontWeight: 500 }}
            >
              {isSubmitting ? 'Submitting...' : 'Submit'}
            </button>
          </div>
        </>
      )}

      {readOnly && (
        <>
          <div className="text-sm font-medium text-gray-700 mb-2" style={{ fontSize: '14px', fontWeight: 500 }}>
            Feedback
          </div>
          <div className="text-sm text-gray-600 whitespace-pre-wrap" style={{ fontSize: '14px', lineHeight: 1.5 }}>
            {comment}
          </div>
          <button
            onClick={onCancel}
            className="mt-3 px-3 py-1.5 text-gray-600 hover:bg-gray-100 rounded text-sm transition-colors"
            style={{ fontSize: '14px', fontWeight: 500 }}
          >
            Close
          </button>
        </>
      )}
    </div>
  );
}
