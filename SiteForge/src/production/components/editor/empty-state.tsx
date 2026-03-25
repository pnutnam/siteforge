'use client';

// Copy from UI-SPEC copywriting contract
const heading = 'Nothing here yet';
const body = 'Start by adding a section from the toolbar below.';

export function EmptyState() {
  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">📝</span>
      </div>
      <h2 className="text-lg font-medium text-gray-900 mb-2" style={{ fontSize: '20px', fontWeight: 600, lineHeight: 1.2 }}>
        {heading}
      </h2>
      <p className="text-gray-500" style={{ fontSize: '16px', lineHeight: 1.5 }}>
        {body}
      </p>
    </div>
  );
}
