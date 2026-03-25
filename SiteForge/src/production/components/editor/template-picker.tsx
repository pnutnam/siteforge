'use client';

import { useState } from 'react';
import { ImportOptionsModal } from './import-options-modal';

interface Template {
  id: string;
  name: string;
  thumbnail: string;
  description: string;
}

interface TemplatePickerProps {
  templates: Template[];
  onSelect: (templateId: string) => void;
  onImportFromPreview: () => void;
}

export function TemplatePicker({ templates, onSelect, onImportFromPreview }: TemplatePickerProps) {
  const [showImportOptions, setShowImportOptions] = useState(false);

  const handleImportClick = () => {
    setShowImportOptions(true);
  };

  const handleImportOption = (option: 'selective' | 'draft' | 'fresh') => {
    setShowImportOptions(false);
    if (option === 'fresh') {
      // Show template grid
    } else {
      onImportFromPreview();
    }
  };

  return (
    <div className="template-picker p-6">
      <h1 className="text-2xl font-semibold mb-6" style={{ fontSize: '28px', fontWeight: 600, lineHeight: 1.1 }}>
        Choose a Template
      </h1>

      {/* Import from Preview button */}
      <button
        onClick={handleImportClick}
        className="w-full mb-8 p-4 border-2 border-dashed border-gray-300 rounded-xl text-left hover:border-blue-400 hover:bg-blue-50 transition-colors"
      >
        <div className="font-medium text-gray-900 mb-1" style={{ fontSize: '14px', fontWeight: 500 }}>
          Import from Preview
        </div>
        <div className="text-sm text-gray-500">
          Start with your preview content
        </div>
      </button>

      {/* Template grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {templates.map((template) => (
          <button
            key={template.id}
            onClick={() => onSelect(template.id)}
            className="template-card border border-gray-200 rounded-xl overflow-hidden hover:border-blue-400 hover:shadow-lg transition-all text-left"
          >
            <div className="aspect-video bg-gray-100">
              <img
                src={template.thumbnail}
                alt={template.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="p-3">
              <div className="font-medium text-gray-900" style={{ fontSize: '14px', fontWeight: 500 }}>
                {template.name}
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {template.description}
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Import options modal */}
      {showImportOptions && (
        <ImportOptionsModal
          onSelect={handleImportOption}
          onClose={() => setShowImportOptions(false)}
        />
      )}
    </div>
  );
}
