'use client';

interface AnnotationPinProps {
  id: string;
  x: number;
  y: number;
  comment: string;
  status: 'open' | 'resolved';
  isActive: boolean;
  onClick: () => void;
  enabled?: boolean;
}

export function AnnotationPin({
  id,
  x,
  y,
  comment,
  status,
  isActive,
  onClick,
  enabled = true,
}: AnnotationPinProps) {
  // Position is percentage-based, centered on pin
  const style = {
    left: `${x}%`,
    top: `${y}%`,
    transform: 'translate(-50%, -50%)',
  };

  const statusColors = {
    open: isActive ? 'bg-blue-500' : 'bg-red-500',
    resolved: 'bg-green-500',
  };

  return (
    <button
      className={`
        annotation-pin absolute w-6 h-6 rounded-full flex items-center justify-center
        shadow-lg transition-all cursor-pointer z-10
        ${statusColors[status]}
        ${isActive ? 'scale-125 ring-4 ring-blue-200' : ''}
        ${!enabled ? 'opacity-50 cursor-default' : 'hover:scale-110'}
      `}
      style={style}
      onClick={(e) => {
        e.stopPropagation();
        if (enabled) onClick();
      }}
      title={comment}
    >
      <span className="text-white text-xs font-bold">
        {status === 'resolved' ? '✓' : '!'}
      </span>
    </button>
  );
}
