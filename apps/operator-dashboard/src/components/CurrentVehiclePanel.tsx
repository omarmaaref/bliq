import type { Vehicle } from '../types';

type Props = {
  currentVehicle: Vehicle | null;
  onRelease: () => void;
  busy: boolean;
};

export function CurrentVehiclePanel({ currentVehicle, onRelease, busy }: Props) {
  return (
    <div className="panel">
      <h3>Your vehicle</h3>
      {currentVehicle ? (
        <div className="holding">
          <div>
            <div className="vehicle-name">{currentVehicle.name}</div>
            <div style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>
              You are currently operating this vehicle.
            </div>
          </div>
          <button className="danger" onClick={onRelease} disabled={busy}>
            {busy ? 'Releasing…' : 'Release'}
          </button>
        </div>
      ) : (
        <div style={{ color: 'var(--text-dim)' }}>
          You are not operating any vehicle. Pick one below to take over.
        </div>
      )}
    </div>
  );
}
