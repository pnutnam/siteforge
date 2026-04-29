'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import type { PipelineState, Phase } from '@/types/pipeline';
import { PHASES, PhaseStatus as PhaseStatusConst } from '@/types/pipeline';

interface UsePipelineWebSocketOptions {
  pipelineId: string;
  onMessage?: (data: unknown) => void;
  onConnect?: () => void;
  onDisconnect?: () => void;
  onError?: (error: Event) => void;
}

interface PipelineEvent {
  type: string;
  data: Record<string, unknown>;
  timestamp: string;
}

export function usePipelineWebSocket({
  pipelineId,
  onMessage,
  onConnect,
  onDisconnect,
  onError,
}: UsePipelineWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [events, setEvents] = useState<PipelineEvent[]>([]);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const connect = useCallback(() => {
    if (!pipelineId || typeof window === 'undefined') return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const host = process.env.NEXT_PUBLIC_API_URL || window.location.host;
    const wsUrl = `${protocol}//${host}/ws/pipeline/${pipelineId}`;

    try {
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        onConnect?.();
      };

      ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          setEvents((prev) => [...prev, data]);
          onMessage?.(data);
        } catch {
          // Ignore parse errors
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        onDisconnect?.();
        
        // Auto-reconnect after 5 seconds
        reconnectTimeoutRef.current = setTimeout(() => {
          if (!wsRef.current || wsRef.current.readyState === WebSocket.CLOSED) {
            connect();
          }
        }, 5000);
      };

      ws.onerror = () => {
        // WebSocket errors are expected when no server is running
        // Silently ignore - the component will fall back to polling
        setIsConnected(false);
      };
    } catch {
      // WebSocket not supported or connection failed - this is fine in demo mode
    }
  }, [pipelineId, onMessage, onConnect, onDisconnect, onError]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  }, []);

  const sendMessage = useCallback((message: string) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(message);
    }
  }, []);

  // Connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    events,
    sendMessage,
    disconnect,
    reconnect: connect,
  };
}

// Hook for polling pipeline state
export function usePipelineState(
  pipelineId: string | null,
  options?: {
    enabled?: boolean;
    interval?: number;
    onUpdate?: (state: PipelineState) => void;
  }
) {
  const { enabled = true, interval = 5000, onUpdate } = options || {};
  
  const [state, setState] = useState<PipelineState | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchState = useCallback(async () => {
    if (!pipelineId || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/pipeline/${pipelineId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch pipeline state');
      }
      const data = await response.json();
      setState(data);
      onUpdate?.(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [pipelineId, enabled, onUpdate]);

  useEffect(() => {
    if (!pipelineId || !enabled) return;

    fetchState();
    const pollInterval = setInterval(fetchState, interval);

    return () => clearInterval(pollInterval);
  }, [pipelineId, enabled, interval, fetchState]);

  return {
    state,
    isLoading,
    error,
    refetch: fetchState,
  };
}

// Hook for phase utilities
export function usePhaseStatus(state: PipelineState | null) {
  const getPhaseStatus = useCallback(
    (phaseId: Phase): 'pending' | 'active' | 'completed' | 'failed' | 'waiting' => {
      if (!state) return 'pending';

      const phaseIndex = PHASES.findIndex((p) => p.id === phaseId);
      const currentIndex = PHASES.findIndex(
        (p) => p.id === (typeof state.current_phase === 'string' ? state.current_phase : state.current_phase)
      );

      if (phaseIndex < currentIndex) return 'completed';
      if (phaseIndex === currentIndex) return 'active';
      if (phaseId === 'phase2_review' && state.current_phase === 'phase2_review')
        return 'waiting';
      return 'pending';
    },
    [state]
  );

  const getProgress = useCallback((): number => {
    if (!state) return 0;
    const currentIndex = PHASES.findIndex(
      (p) => p.id === (typeof state.current_phase === 'string' ? state.current_phase : state.current_phase)
    );
    return Math.round((currentIndex / (PHASES.length - 1)) * 100);
  }, [state]);

  const isPhaseComplete = useCallback(
    (phaseId: Phase): boolean => {
      return getPhaseStatus(phaseId) === PhaseStatusConst.COMPLETED;
    },
    [getPhaseStatus]
  );

  const isPhaseActive = useCallback(
    (phaseId: Phase): boolean => {
      return getPhaseStatus(phaseId) === PhaseStatusConst.ACTIVE;
    },
    [getPhaseStatus]
  );

  const getCompletedPhases = useCallback((): Phase[] => {
    return PHASES.filter((p) => isPhaseComplete(p.id)).map((p) => p.id);
  }, [isPhaseComplete]);

  const getPendingPhases = useCallback((): Phase[] => {
    return PHASES.filter((p) => !isPhaseComplete(p.id) && !isPhaseActive(p.id)).map((p) => p.id);
  }, [isPhaseComplete, isPhaseActive]);

  const getCurrentPhase = useCallback((): Phase | null => {
    if (!state) return null;
    return typeof state.current_phase === 'string' 
      ? (state.current_phase as Phase)
      : state.current_phase;
  }, [state]);

  return {
    getPhaseStatus,
    getProgress,
    isPhaseComplete,
    isPhaseActive,
    getCompletedPhases,
    getPendingPhases,
    getCurrentPhase,
  };
}

export default usePipelineWebSocket;
