'use client';

interface AnnotationDetailProps {
  id: string;
  pinX: number;
  pinY: number;
  comment: string;
  status: 'open' | 'resolved';
  businessName: string;
  ownerEmail: string;
  ownerName: string;
  screenshotUrl?: string;
  pageUrl: string;
  createdAt: string;
  resolvedAt?: string;
  resolvedBy?: string;
  onResolve: (id: string) => void;
  onContactOwner: (email: string) => void;
  onClose: () => void;
}

export function AnnotationDetail({
  id,
  pinX,
  pinY,
  comment,
  status,
  businessName,
  ownerEmail,
  ownerName,
  screenshotUrl,
  pageUrl,
  createdAt,
  resolvedAt,
  onResolve,
  onContactOwner,
  onClose,
}: AnnotationDetailProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="annotation-detail">
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={`
              inline-block px-2 py-0.5 rounded text-xs font-medium
              ${status === 'open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}
            `}>
              {status === 'open' ? 'Open' : 'Resolved'}
            </span>
          </div>
          <h2 className="text-lg font-semibold" style={{ fontSize: '20px', fontWeight: 600 }}>
            Feedback from {ownerName}
          </h2>
        </div>
        <button
          onClick={onClose}
          className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded"
        >
          ✕
        </button>
      </div>

      {/* Business info */}
      <div className="bg-gray-50 rounded-lg p-3 mb-4">
        <div className="text-sm font-medium text-gray-900" style={{ fontSize: '14px' }}>
          {businessName}
        </div>
        <div className="text-sm text-gray-500" style={{ fontSize: '14px' }}>
          {ownerEmail}
        </div>
      </div>

      {/* Screenshot */}
      {screenshotUrl && (
        <div className="mb-4">
          <div className="text-sm font-medium text-gray-700 mb-2" style={{ fontSize: '14px' }}>
            Screenshot
          </div>
          <a
            href={screenshotUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="block border border-gray-200 rounded-lg overflow-hidden hover:border-gray-300"
          >
            <img src={screenshotUrl} alt="Annotated page" className="w-full" />
          </a>
        </div>
      )}

      {/* Comment */}
      <div className="mb-4">
        <div className="text-sm font-medium text-gray-700 mb-2" style={{ fontSize: '14px' }}>
          Comment
        </div>
        <div className="bg-gray-50 rounded-lg p-3">
          <p className="text-sm text-gray-900 whitespace-pre-wrap" style={{ fontSize: '14px', lineHeight: 1.5 }}>
            {comment}
          </p>
        </div>
      </div>

      {/* Pin position */}
      <div className="mb-4 text-sm text-gray-500" style={{ fontSize: '14px' }}>
        <span className="font-medium">Pin position:</span> ({Math.round(pinX)}%, {Math.round(pinY)}%)
        <span className="mx-2">·</span>
        <a href={pageUrl} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
          View page
        </a>
      </div>

      {/* Timestamps */}
      <div className="text-xs text-gray-400 mb-4">
        Created: {formattedDate}
        {resolvedAt && <div>Resolved: {new Date(resolvedAt).toLocaleString()}</div>}
      </div>

      {/* Actions */}
      {status === 'open' && (
        <div className="flex gap-3">
          <button
            onClick={() => onResolve(id)}
            className="flex-1 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors"
            style={{ fontSize: '14px', fontWeight: 500 }}
          >
            Mark Resolved
          </button>
          <button
            onClick={() => onContactOwner(ownerEmail)}
            className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
            style={{ fontSize: '14px', fontWeight: 500 }}
          >
            Contact Owner
          </button>
        </div>
      )}
    </div>
  );
}
