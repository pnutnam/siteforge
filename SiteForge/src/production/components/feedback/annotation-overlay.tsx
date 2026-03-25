'use client';

import { useState, useRef, useCallback } from 'react';
import { AnnotationPin } from './annotation-pin';
import { AnnotationPanel } from './annotation-panel';

interface AnnotationOverlayProps {
  previewHash: string;
  businessId: string;
  tenantId: string;
  ownerAccountId: string;
  annotations: Array<{
    id: string;
    pinX: number;
    pinY: number;
    comment: string;
    status: 'open' | 'resolved';
  }>;
  onSubmit: (data: { pinX: number; pinY: number; comment: string }) => Promise<void>;
  enabled?: boolean;
}

export function AnnotationOverlay({
  previewHash,
  businessId,
  tenantId,
  ownerAccountId,
  annotations,
  onSubmit,
  enabled = false,
}: AnnotationOverlayProps) {
  const [pins, setPins] = useState(annotations);
  const [activePinId, setActivePinId] = useState<string | null>(null);
  const [isPlacingPin, setIsPlacingPin] = useState(false);
  const [pendingPin, setPendingPin] = useState<{ x: number; y: number } | null>(null);
  const overlayRef = useRef<HTMLDivElement>(null);

  // Convert click to percentage coordinates (0-100)
  const getPercentagePosition = useCallback((clientX: number, clientY: number) => {
    if (!overlayRef.current) return null;

    const rect = overlayRef.current.getBoundingClientRect();
    const x = ((clientX - rect.left) / rect.width) * 100;
    const y = ((clientY - rect.top) / rect.height) * 100;

    return {
      x: Math.max(0, Math.min(100, x)),
      y: Math.max(0, Math.min(100, y)),
    };
  }, []);

  const handleOverlayClick = useCallback((e: React.MouseEvent) => {
    if (!enabled || isPlacingPin) return;

    // Don't place pin if clicking on existing pin or panel
    if ((e.target as HTMLElement).closest('.annotation-pin') || (e.target as HTMLElement).closest('.annotation-panel')) {
      return;
    }

    const pos = getPercentagePosition(e.clientX, e.clientY);
    if (pos) {
      setPendingPin(pos);
      setIsPlacingPin(true);
    }
  }, [enabled, isPlacingPin, getPercentagePosition]);

  const handlePinClick = useCallback((pinId: string) => {
    setActivePinId(activePinId === pinId ? null : pinId);
    setPendingPin(null);
    setIsPlacingPin(false);
  }, [activePinId]);

  const handleSubmit = useCallback(async (comment: string) => {
    if (!pendingPin) return;

    await onSubmit({
      pinX: pendingPin.x,
      pinY: pendingPin.y,
      comment,
    });

    // Add to local pins
    const newPin = {
      id: `pin-${Date.now()}`,
      pinX: pendingPin.x,
      pinY: pendingPin.y,
      comment,
      status: 'open' as const,
    };
    setPins([...pins, newPin]);
    setPendingPin(null);
    setIsPlacingPin(false);
  }, [pendingPin, onSubmit, pins]);

  const handleCancel = useCallback(() => {
    setPendingPin(null);
    setIsPlacingPin(false);
  }, []);

  return (
    <div
      ref={overlayRef}
      className={`annotation-overlay relative w-full h-full ${enabled ? 'cursor-crosshair' : 'cursor-default'}`}
      onClick={handleOverlayClick}
    >
      {/* Existing pins */}
      {pins.map((pin) => (
        <AnnotationPin
          key={pin.id}
          id={pin.id}
          x={pin.pinX}
          y={pin.pinY}
          comment={pin.comment}
          status={pin.status}
          isActive={activePinId === pin.id}
          onClick={() => handlePinClick(pin.id)}
          enabled={enabled}
        />
      ))}

      {/* Pending pin (being placed) */}
      {pendingPin && (
        <AnnotationPin
          id="pending"
          x={pendingPin.x}
          y={pendingPin.y}
          comment=""
          status="open"
          isActive={true}
          onClick={() => {}}
          enabled={true}
        />
      )}

      {/* Annotation panel for pending pin */}
      {pendingPin && (
        <AnnotationPanel
          onSubmit={handleSubmit}
          onCancel={handleCancel}
          positionX={pendingPin.x}
          positionY={pendingPin.y}
        />
      )}

      {/* Panel for clicking on existing pin */}
      {activePinId && !pendingPin && (
        <div className="annotation-panel-wrapper">
          {pins.find(p => p.id === activePinId) && (
            <AnnotationPanel
              comment={pins.find(p => p.id === activePinId)?.comment}
              onSubmit={() => {}}
              onCancel={() => setActivePinId(null)}
              positionX={pins.find(p => p.id === activePinId)!.pinX}
              positionY={pins.find(p => p.id === activePinId)!.pinY}
              readOnly={true}
            />
          )}
        </div>
      )}
    </div>
  );
}
