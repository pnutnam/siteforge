'use client';

interface AnnotationCardProps {
  id: string;
  pinX: number;
  pinY: number;
  comment: string;
  status: 'open' | 'resolved';
  businessName: string;
  ownerEmail: string;
  screenshotUrl?: string;
  createdAt: string;
  onClick: () => void;
}

export function AnnotationCard({
  id,
  pinX,
  pinY,
  comment,
  status,
  businessName,
  ownerEmail,
  screenshotUrl,
  createdAt,
  onClick,
}: AnnotationCardProps) {
  const formattedDate = new Date(createdAt).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <button
      onClick={onClick}
      className={`
        annotation-card w-full text-left p-4 border rounded-lg transition-all
        ${status === 'open' ? 'border-red-200 bg-red-50 hover:border-red-400' : 'border-green-200 bg-green-50 hover:border-green-400'}
      `}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          {/* Status badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`
              inline-block px-2 py-0.5 rounded text-xs font-medium
              ${status === 'open' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}
            `}>
              {status === 'open' ? 'Open' : 'Resolved'}
            </span>
            <span className="text-xs text-gray-500">{formattedDate}</span>
          </div>

          {/* Comment preview */}
          <p className="text-sm text-gray-900 line-clamp-2 mb-2" style={{ fontSize: '14px', lineHeight: 1.5 }}>
            {comment}
          </p>

          {/* Owner info */}
          <div className="text-xs text-gray-500">
            <span className="font-medium">{businessName}</span>
            <span className="mx-1">·</span>
            <span>{ownerEmail}</span>
          </div>

          {/* Pin position */}
          <div className="text-xs text-gray-400 mt-1">
            Position: ({Math.round(pinX)}%, {Math.round(pinY)}%)
          </div>
        </div>

        {/* Screenshot thumbnail */}
        {screenshotUrl && (
          <div className="w-16 h-16 flex-shrink-0 rounded overflow-hidden bg-gray-100">
            <img src={screenshotUrl} alt="" className="w-full h-full object-cover" />
          </div>
        )}
      </div>
    </button>
  );
}
