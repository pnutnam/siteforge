'use client';

// Copy from UI-SPEC copywriting contract
const heading = 'Your account is pending';
const body = "The dev team is reviewing your feedback. You'll have full access once approved.";

export function PendingBanner() {
  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="w-16 h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">⏳</span>
        </div>
        <h1 className="text-xl font-semibold text-gray-900 mb-2" style={{ fontSize: '20px', fontWeight: 600, lineHeight: 1.2 }}>
          {heading}
        </h1>
        <p className="text-gray-600" style={{ fontSize: '16px', lineHeight: 1.5 }}>
          {body}
        </p>
      </div>
    </div>
  );
}
