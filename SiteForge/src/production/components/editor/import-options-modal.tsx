'use client';

interface ImportOptionsModalProps {
  onSelect: (option: 'selective' | 'draft' | 'fresh') => void;
  onClose: () => void;
}

// Copy from UI-SPEC copywriting contract
const heading = 'Import from Preview';
const options = [
  {
    id: 'selective',
    label: 'Selective import',
    caveat: 'Pick which sections to bring over',
  },
  {
    id: 'draft',
    label: 'Import all as draft',
    caveat: 'All preview content imports as editable drafts',
  },
  {
    id: 'fresh',
    label: 'Fresh template',
    caveat: 'Start from a production template only',
  },
];

export function ImportOptionsModal({ onSelect, onClose }: ImportOptionsModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-4" style={{ fontSize: '20px', fontWeight: 600, lineHeight: 1.2 }}>
          {heading}
        </h2>

        <div className="flex flex-col gap-3 mb-6">
          {options.map((option) => (
            <button
              key={option.id}
              onClick={() => onSelect(option.id as 'selective' | 'draft' | 'fresh')}
              className="p-4 border border-gray-200 rounded-lg text-left hover:border-blue-400 hover:bg-blue-50 transition-colors"
            >
              <div className="font-medium text-gray-900 mb-1" style={{ fontSize: '14px', fontWeight: 500 }}>
                {option.label}
              </div>
              <div className="text-sm text-gray-500">
                {option.caveat}
              </div>
            </button>
          ))}
        </div>

        <button
          onClick={onClose}
          className="w-full py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          style={{ fontSize: '14px', fontWeight: 500 }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
