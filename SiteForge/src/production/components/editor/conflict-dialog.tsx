'use client';

interface ConflictDialogProps {
  onReload: () => void;
  onCancel: () => void;
}

export function ConflictDialog({ onReload, onCancel }: ConflictDialogProps) {
  // Copy from UI-SPEC copywriting contract
  const heading = 'Page was edited elsewhere';
  const body = 'This page was edited somewhere else. Reload to see changes?';
  const reloadLabel = 'Reload';
  const cancelLabel = 'Cancel';

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-2xl p-6 max-w-md w-full mx-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2" style={{ fontSize: '20px', fontWeight: 600, lineHeight: 1.2 }}>
          {heading}
        </h2>
        <p className="text-gray-600 mb-6" style={{ fontSize: '16px', lineHeight: 1.5 }}>
          {body}
        </p>
        <div className="flex gap-3 justify-end">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            style={{ fontSize: '14px', fontWeight: 500 }}
          >
            {cancelLabel}
          </button>
          <button
            onClick={onReload}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
            style={{ fontSize: '14px', fontWeight: 500 }}
          >
            {reloadLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
