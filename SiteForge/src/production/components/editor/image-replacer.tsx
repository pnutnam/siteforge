'use client';

import { useRef } from 'react';

interface ImageReplacerProps {
  currentSrc: string;
  onReplace: (file: File) => void;
  businessId: string;
}

export function ImageReplacer({ currentSrc, onReplace, businessId }: ImageReplacerProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      onReplace(file);
    }
  };

  return (
    <div className="relative group cursor-pointer" onClick={handleClick}>
      <img
        src={currentSrc}
        alt="Editable section"
        className="w-full h-auto"
      />
      {/* Overlay on hover - from UI-SPEC 44px touch target */}
      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
        <div className="opacity-0 group-hover:opacity-100 transition-opacity bg-white px-4 py-2 rounded-lg shadow text-sm font-medium">
          Tap to replace
        </div>
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileChange}
        className="hidden"
      />
    </div>
  );
}
