'use client';

// Copy from UI-SPEC copywriting contract
const message = 'Something went wrong. Please try again.';

interface ErrorStateProps {
  onRetry?: () => void;
}

export function ErrorState({ onRetry }: ErrorStateProps) {
  return (
    <div className="min-h-[200px] flex flex-col items-center justify-center p-8 text-center">
      <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
        <span className="text-2xl">⚠️</span>
      </div>
      <p className="text-red-600 mb-4" style={{ fontSize: '16px', lineHeight: 1.5 }}>
        {message}
      </p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-lg transition-colors"
          style={{ fontSize: '14px', fontWeight: 500 }}
        >
          Try Again
        </button>
      )}
    </div>
  );
}
