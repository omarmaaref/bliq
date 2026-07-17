import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { ApiError, type Operator, type Vehicle } from '../types';
import { CurrentVehiclePanel } from './CurrentVehiclePanel';
import { Toast, type ToastState } from './Toast';
import { VehiclesTable } from './VehiclesTable';

type Props = {
  operatorId: string;
  onSwitchOperator: () => void;
};

const POLL_INTERVAL_MS = 5000;

export function Dashboard({ operatorId, onSwitchOperator }: Props) {
  const [operator, setOperator] = useState<Operator | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busyVehicleId, setBusyVehicleId] = useState<string | null>(null);
  const [releasing, setReleasing] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

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

  useEffect(() => {
    refresh();
    const interval = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [refresh]);

  const currentVehicle =
    vehicles && operator?.currentVehicleId
      ? (vehicles.find((v) => v.id === operator.currentVehicleId) ?? null)
      : null;

  const handleTakeover = async (vehicleId: string) => {
    setBusyVehicleId(vehicleId);
    try {
      const updated = await api.takeover(operatorId, vehicleId);
      setToast({
        kind: 'success',
        message: `You are now operating ${updated.name}.`,
      });
      await refresh();
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        setToast({ kind: 'error', message: e.message, code: e.code });
      } else {
        setToast({ kind: 'error', message: 'Takeover failed.' });
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
      setToast({
        kind: 'success',
        message: `${currentVehicle.name} released.`,
      });
      await refresh();
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        setToast({ kind: 'error', message: e.message, code: e.code });
      } else {
        setToast({ kind: 'error', message: 'Release failed.' });
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
        <div className="state">Loading…</div>
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
        <button onClick={onSwitchOperator}>Switch operator</button>
      </div>

      <CurrentVehiclePanel
        currentVehicle={currentVehicle}
        onRelease={handleRelease}
        busy={releasing}
      />

      <VehiclesTable
        vehicles={vehicles}
        currentOperatorId={operatorId}
        currentVehicleId={operator.currentVehicleId}
        busyVehicleId={busyVehicleId}
        onTakeover={handleTakeover}
      />

      <Toast toast={toast} onDismiss={() => setToast(null)} />
    </div>
  );
}
