import { useCallback, useEffect, useState } from 'react';
import { api } from '../api';
import { ApiError, type Vehicle } from '../types';
import { AddVehicleForm } from './AddVehicleForm';
import { Toasts, useToasts } from './Toast';
import { VehiclesTable } from './VehiclesTable';

const POLL_INTERVAL_MS = 5000;

export function AdminDashboard() {
  const [vehicles, setVehicles] = useState<Vehicle[] | null>(null);
  const [operatorNames, setOperatorNames] = useState<Record<string, string>>(
    {},
  );
  const [error, setError] = useState<string | null>(null);
  const [busyVehicleId, setBusyVehicleId] = useState<string | null>(null);
  const { toasts, push, dismiss } = useToasts();

  const refresh = useCallback(async () => {
    try {
      const list = await api.listVehicles();
      setVehicles(list);
      setError(null);
    } catch (e: unknown) {
      setError(e instanceof ApiError ? e.message : 'Failed to load vehicles');
    }
  }, []);

  // Poll every 5s.
  useEffect(() => {
    refresh();
    const interval = window.setInterval(refresh, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [refresh]);

  // Fetch operator names once so assignment column can show who is driving.
  useEffect(() => {
    api
      .listOperators()
      .then((list) => {
        setOperatorNames(Object.fromEntries(list.map((o) => [o.id, o.name])));
      })
      .catch(() => {
        // non-fatal
      });
  }, []);

  const handleCreate = async (name: string) => {
    try {
      const created = await api.createVehicle(name);
      push({ kind: 'success', message: `Added ${created.name}.` });
      await refresh();
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        push({ kind: 'error', message: e.message, code: e.code });
      } else {
        push({ kind: 'error', message: 'Failed to add vehicle.' });
      }
    }
  };

  const handleToggle = async (v: Vehicle) => {
    const next = v.connectivityStatus === 'online' ? 'offline' : 'online';
    setBusyVehicleId(v.id);
    try {
      await api.setConnectivity(v.id, next);
      push({ kind: 'success', message: `${v.name} is now ${next}.` });
      await refresh();
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        push({ kind: 'error', message: e.message, code: e.code });
      } else {
        push({ kind: 'error', message: 'Failed to update connectivity.' });
      }
    } finally {
      setBusyVehicleId(null);
    }
  };

  const handleDelete = async (v: Vehicle) => {
    if (!window.confirm(`Delete ${v.name}? This cannot be undone.`)) return;
    setBusyVehicleId(v.id);
    try {
      await api.deleteVehicle(v.id);
      push({ kind: 'success', message: `${v.name} deleted.` });
      await refresh();
    } catch (e: unknown) {
      if (e instanceof ApiError) {
        push({ kind: 'error', message: e.message, code: e.code });
      } else {
        push({ kind: 'error', message: 'Failed to delete vehicle.' });
      }
    } finally {
      setBusyVehicleId(null);
    }
  };

  if (error && vehicles === null) {
    return (
      <div className="app">
        <div className="state error">{error}</div>
      </div>
    );
  }

  if (vehicles === null) {
    return (
      <div className="app">
        <div className="state">Loading fleet…</div>
      </div>
    );
  }

  return (
    <div className="app">
      <div className="header">
        <div>
          <h1>Bliq Fleet Admin</h1>
          <div className="subtitle">
            {vehicles.length} vehicle{vehicles.length === 1 ? '' : 's'} in the
            fleet
          </div>
        </div>
      </div>

      <AddVehicleForm onCreate={handleCreate} />

      <VehiclesTable
        vehicles={vehicles}
        operatorNames={operatorNames}
        busyVehicleId={busyVehicleId}
        onToggleConnectivity={handleToggle}
        onDelete={handleDelete}
      />

      <Toasts toasts={toasts} onDismiss={dismiss} />
    </div>
  );
}
