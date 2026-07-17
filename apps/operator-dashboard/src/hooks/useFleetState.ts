import { useCallback, useEffect, useRef, useState } from 'react';
import { io, type Socket } from 'socket.io-client';
import { api } from '../api';
import {
  ApiError,
  type Operator,
  type SyncMode,
  type Vehicle,
  type VehicleChangedEvent,
} from '../types';

const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';
const POLL_INTERVAL_MS = 5000;

export type FleetState = {
  vehicles: Vehicle[] | null;
  operator: Operator | null;
  error: string | null;
  refresh: () => Promise<void>;
};

export function useFleetState(
  operatorId: string,
  mode: SyncMode,
  onVehicleEvent?: (event: VehicleChangedEvent) => void,
  onWebSocketFallback?: (reason: string) => void,
): FleetState {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [operator, setOperator] = useState<Operator | null>(null);
  const [error, setError] = useState<string | null>(null);
  const onEventRef = useRef(onVehicleEvent);
  onEventRef.current = onVehicleEvent;
  const onFallbackRef = useRef(onWebSocketFallback);
  onFallbackRef.current = onWebSocketFallback;

  const refresh = useCallback(async () => {
    try {
      const [op, list] = await Promise.all([
        api.getOperator(operatorId),
        api.listVehicles(),
      ]);
      setOperator(op);
      setVehicles(list);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Failed to load dashboard');
    }
  }, [operatorId]);

  // Polling mode: periodic HTTP refresh.
  useEffect(() => {
    if (mode !== 'polling') return;
    refresh();
    const interval = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [mode, refresh]);

  // WebSocket mode: snapshot + delta stream. Operator name fetched once via HTTP;
  // operator.currentVehicleId is derived from the vehicles list by consumers.
  useEffect(() => {
    if (mode !== 'websocket') return;

    let cancelled = false;

    api
      .getOperator(operatorId)
      .then((op) => {
        if (!cancelled) setOperator(op);
      })
      .catch((e: unknown) => {
        if (!cancelled) {
          setError(e instanceof ApiError ? e.message : 'Failed to load operator');
        }
      });

    const socket: Socket = io(`${API_URL}/realtime`, {
      transports: ['websocket'],
      withCredentials: true,
      // Fail fast: two attempts, then trigger fallback.
      reconnectionAttempts: 2,
      timeout: 3000,
    });

    let fallbackFired = false;
    const fallback = (reason: string) => {
      if (fallbackFired || cancelled) return;
      fallbackFired = true;
      socket.disconnect();
      onFallbackRef.current?.(reason);
    };

    socket.on('vehicles.snapshot', (snapshot: Vehicle[]) => {
      setVehicles(snapshot);
      setError(null);
    });

    socket.on('vehicle.changed', (event: VehicleChangedEvent) => {
      setVehicles((prev) => {
        if (!prev) return prev;
        if (event.kind === 'deleted') {
          return prev.filter((v) => v.id !== event.vehicleId);
        }
        if (!event.vehicle) return prev;
        const existing = prev.findIndex((v) => v.id === event.vehicleId);
        if (existing === -1) return [...prev, event.vehicle];
        const next = prev.slice();
        next[existing] = event.vehicle;
        return next;
      });
      onEventRef.current?.(event);
    });

    socket.on('connect_error', (err) => {
      fallback(err.message || 'connect error');
    });
    socket.io.on('reconnect_failed', () => {
      fallback('reconnect failed');
    });

    return () => {
      cancelled = true;
      socket.disconnect();
    };
  }, [mode, operatorId]);

  return { vehicles, operator, error, refresh };
}
