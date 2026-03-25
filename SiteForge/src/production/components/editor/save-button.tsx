'use client';

import { useState } from 'react';

interface SaveButtonProps {
  onSave: () => Promise<void>;
}

export function SaveButton({ onSave }: SaveButtonProps) {
  const [state, setState] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  const handleClick = async () => {
    if (state === 'saving') return;

    setState('saving');
    try {
      await onSave();
      setState('saved');
      setTimeout(() => setState('idle'), 2000);
    } catch {
      setState('error');
      setTimeout(() => setState('idle'), 3000);
    }
  };

  const labels = {
    idle: 'Save',
    saving: 'Saving...',
    saved: 'Saved',
    error: 'Error - Retry',
  };

  const colors = {
    idle: 'bg-blue-600 hover:bg-blue-700 text-white',
    saving: 'bg-gray-400 text-white cursor-wait',
    saved: 'bg-green-600 text-white',
    error: 'bg-red-600 hover:bg-red-700 text-white',
  };

  return (
    <button
      onClick={handleClick}
      disabled={state === 'saving'}
      className={`
        px-6 py-2.5 rounded-lg font-semibold transition-all
        ${colors[state]}
      `}
      style={{ fontSize: '14px', fontWeight: 500 }}
    >
      {labels[state]}
    </button>
  );
}
