'use client';

import { useState, useRef } from 'react';

interface SectionDragHandleProps {
  sectionId: string;
  index: number;
  onReorder: (fromIndex: number, toIndex: number) => void;
}

export function SectionDragHandle({ sectionId, index, onReorder }: SectionDragHandleProps) {
  const [isDragging, setIsDragging] = useState(false);
  const dragStartY = useRef<number>(0);

  // Per UI-SPEC: 44px touch target for mobile drag handles
  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartY.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartY.current;

    // Simple reorder: if dragged more than 50px, trigger reorder
    if (Math.abs(deltaY) > 50) {
      const direction = deltaY > 0 ? 1 : -1;
      onReorder(index, index + direction);
      setIsDragging(false);
    }
  };

  const handleTouchEnd = () => {
    setIsDragging(false);
  };

  return (
    <div
      className={`drag-handle w-11 h-11 flex items-center justify-center bg-gray-100 rounded cursor-grab active:cursor-grabbing ${
        isDragging ? 'bg-blue-100' : ''
      }`}
      style={{ minWidth: '44px', minHeight: '44px' }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div className="flex flex-col gap-1">
        <div className="w-4 h-0.5 bg-gray-400 rounded" />
        <div className="w-4 h-0.5 bg-gray-400 rounded" />
        <div className="w-4 h-0.5 bg-gray-400 rounded" />
      </div>
    </div>
  );
}
