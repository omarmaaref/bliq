import { useCallback, useState } from 'react';
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
  const [mode, setMode] = useState<SyncMode>('polling');
  const [busyVehicleId, setBusyVehicleId] = useState<string | null>(null);
  const [releasing, setReleasing] = useState(false);
  const { toasts, push, dismiss } = useToasts();

  const handleEvent = useCallback(
    (event: VehicleChangedEvent) => {
      push({ kind: 'info', message: describeEvent(event) });
    },
    [push],
  );

  const { vehicles, operator, error, refresh } = useFleetState(
    operatorId,
    mode,
    handleEvent,
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
        onTakeover={handleTakeover}
      />

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
