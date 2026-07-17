import type { Vehicle } from '../types';

type Props = {
  vehicles: Vehicle[];
  currentOperatorId: string;
  currentVehicleId: string | null;
  busyVehicleId: string | null;
  onTakeover: (vehicleId: string) => void;
};

function statusOf(v: Vehicle): {
  label: string;
  className: string;
} {
  if (v.connectivityStatus === 'offline') {
    return { label: 'Offline', className: 'offline' };
  }
  return v.assignedOperatorId === null
    ? { label: 'Available', className: 'available' }
    : { label: 'In use', className: 'in-use' };
}

export function VehiclesTable({
  vehicles,
  currentOperatorId,
  currentVehicleId,
  busyVehicleId,
  onTakeover,
}: Props) {
  if (vehicles.length === 0) {
    return (
      <div className="panel">
        <div className="state">No vehicles in the fleet yet.</div>
      </div>
    );
  }

  return (
    <div className="panel">
      <h3>Fleet</h3>
      <table>
        <thead>
          <tr>
            <th>Vehicle</th>
            <th>Connectivity</th>
            <th>Status</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => {
            const status = statusOf(v);
            const isMine =
              v.assignedOperatorId === currentOperatorId ||
              v.id === currentVehicleId;
            const canTake =
              v.connectivityStatus === 'online' &&
              v.assignedOperatorId === null &&
              currentVehicleId === null;
            return (
              <tr key={v.id}>
                <td>{v.name}</td>
                <td>
                  <span className={`badge ${v.connectivityStatus}`}>
                    {v.connectivityStatus}
                  </span>
                </td>
                <td>
                  {isMine ? (
                    <span className="badge mine">You</span>
                  ) : (
                    <span className={`badge ${status.className}`}>
                      {status.label}
                    </span>
                  )}
                </td>
                <td style={{ textAlign: 'right' }}>
                  {canTake && (
                    <button
                      onClick={() => onTakeover(v.id)}
                      disabled={busyVehicleId !== null}
                    >
                      {busyVehicleId === v.id ? 'Taking over…' : 'Takeover'}
                    </button>
                  )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
