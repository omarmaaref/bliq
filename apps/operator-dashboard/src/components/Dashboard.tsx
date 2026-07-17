import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { useFleetState } from '../hooks/useFleetState';
import { useToasts } from '../hooks/useToasts';
import { ApiError, type SyncMode, type Vehicle, type VehicleChangedEvent } from '../types';
import { CurrentVehiclePanel } from './CurrentVehiclePanel';
import { Toasts } from './Toast';
import { VehiclesTable } from './VehiclesTable';

type Props = {
  operatorId: string;
  onSwitchOperator: () => void;
};

const FLASH_DURATION_MS = 3000;

function statusText(v: Vehicle | null): string {
  if (!v) return 'removed';
  if (v.connectivityStatus === 'offline') return 'offline';
  return v.assignedOperatorId ? 'assigned' : 'available';
}

function describeEvent(event: VehicleChangedEvent): string {
  const name = event.vehicle?.name ?? event.vehicleId.slice(-4);
  switch (event.kind) {
    case 'created':
      return `New vehicle: ${name}`;
    case 'updated':
      return `${name} · ${statusText(event.vehicle)}`;
    case 'deleted':
      return `Vehicle removed`;
  }
}

export function Dashboard({ operatorId, onSwitchOperator }: Props) {
  const [mode, setMode] = useState<SyncMode>('websocket');
  const [busyVehicleId, setBusyVehicleId] = useState<string | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [operatorNames, setOperatorNames] = useState<Record<string, string>>({});
  const [recentlyChangedIds, setRecentlyChangedIds] = useState<Set<string>>(
    () => new Set(),
  );
  const flashTimers = useRef<Map<string, number>>(new Map());
  const { toasts, push, dismiss } = useToasts();

  // Fetch operator names once — used to render "in use by X" on rows.
  useEffect(() => {
    api
      .listOperators()
      .then((list) => {
        setOperatorNames(
          Object.fromEntries(list.map((o) => [o.id, o.name])),
        );
      })
      .catch(() => {
        // non-fatal: rows fall back to id suffix
      });
  }, []);

  const flashRow = useCallback((vehicleId: string) => {
    setRecentlyChangedIds((prev) => {
      const next = new Set(prev);
      next.add(vehicleId);
      return next;
    });
    const existing = flashTimers.current.get(vehicleId);
    if (existing) window.clearTimeout(existing);
    const timer = window.setTimeout(() => {
      setRecentlyChangedIds((prev) => {
        const next = new Set(prev);
        next.delete(vehicleId);
        return next;
      });
      flashTimers.current.delete(vehicleId);
    }, FLASH_DURATION_MS);
    flashTimers.current.set(vehicleId, timer);
  }, []);

  // Clear all timers on unmount.
  useEffect(() => {
    const map = flashTimers.current;
    return () => {
      map.forEach((t) => window.clearTimeout(t));
      map.clear();
    };
  }, []);

  const handleEvent = useCallback(
    (event: VehicleChangedEvent) => {
      push({ kind: 'info', message: describeEvent(event) });
      flashRow(event.vehicleId);
    },
    [push, flashRow],
  );

  const handleFallback = useCallback(
    (reason: string) => {
      push({
        kind: 'error',
        message: 'WebSocket unavailable, falling back to polling.',
        code: reason,
      });
      setMode('polling');
    },
    [push],
  );

  const { vehicles, operator, error, refresh } = useFleetState(
    operatorId,
    mode,
    handleEvent,
    handleFallback,
  );

  const currentVehicle =
    vehicles?.find((v) => v.assignedOperatorId === operatorId) ?? null;

  const handleTakeover = async (vehicleId: string) => {
    setBusyVehicleId(vehicleId);
    try {
      const updated = await api.takeover(operatorId, vehicleId);
      push({
        kind: 'success',
        message: `You are now operating ${updated.name}.`,
      });
      if (mode === 'polling') await refresh();
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        push({ kind: 'error', message: e.message, code: e.code });
      } else {
        push({ kind: 'error', message: 'Takeover failed.' });
      }
    } finally {
      setBusyVehicleId(null);
    }
  };

  const handleRelease = async () => {
    if (!currentVehicle) return;
    setReleasing(true);
    try {
      await api.release(operatorId, currentVehicle.id);
      push({ kind: 'success', message: `${currentVehicle.name} released.` });
      if (mode === 'polling') await refresh();
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        push({ kind: 'error', message: e.message, code: e.code });
      } else {
        push({ kind: 'error', message: 'Release failed.' });
      }
    } finally {
      setReleasing(false);
    }
  };

  if (error) {
    return (
      <div className="app">
        <div className="state error">{error}</div>
      </div>
    );
  }

  if (!operator || !vehicles) {
    return (
      <div className="app">
        <div className="state">Loading… ({mode})</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <div>
          <h1>Bliq Fleet Control</h1>
          <div className="who">
            You are <strong>{operator.name}</strong>
          </div>
        </div>
        <div className="header-actions">
          <div className="mode-toggle" role="group" aria-label="Sync mode">
            <button
              className={mode === 'polling' ? 'primary' : 'ghost'}
              onClick={() => setMode('polling')}
            >
              Polling
            </button>
            <button
              className={mode === 'websocket' ? 'primary' : 'ghost'}
              onClick={() => setMode('websocket')}
            >
              WebSocket
            </button>
          </div>
          <button className="ghost" onClick={onSwitchOperator}>
            Switch operator
          </button>
        </div>
      </div>

      <CurrentVehiclePanel
        currentVehicle={currentVehicle}
        onRelease={handleRelease}
        busy={releasing}
      />

      <VehiclesTable
        vehicles={vehicles}
        currentOperatorId={operatorId}
        currentVehicleId={currentVehicle?.id ?? null}
        busyVehicleId={busyVehicleId}
        operatorNames={operatorNames}
        recentlyChangedIds={recentlyChangedIds}
        onTakeover={handleTakeover}
      />

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
