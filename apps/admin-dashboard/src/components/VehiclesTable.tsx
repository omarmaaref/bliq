import type { Vehicle } from '../types';

type Props = {
  vehicles: Vehicle[];
  operatorNames: Record<string, string>;
  busyVehicleId: string | null;
  onToggleConnectivity: (v: Vehicle) => void;
  onDelete: (v: Vehicle) => void;
};

function assignmentLabel(
  v: Vehicle,
  operatorNames: Record<string, string>,
): { label: string; className: string } {
  if (v.assignedOperatorId === null) {
    return { label: 'Available', className: 'available' };
  }
  const holderName =
    operatorNames[v.assignedOperatorId] ??
    `Operator ${v.assignedOperatorId.slice(-4)}`;
  return { label: holderName, className: 'in-use' };
}

export function VehiclesTable({
  vehicles,
  operatorNames,
  busyVehicleId,
  onToggleConnectivity,
  onDelete,
}: Props) {
  if (vehicles.length === 0) {
    return (
      <div className="panel">
        <div className="state">No vehicles yet. Add one above.</div>
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
            <th>Assignment</th>
            <th style={{ textAlign: 'right' }}>Actions</th>
          </tr>
        </thead>
        <tbody>
          {vehicles.map((v) => {
            const assignment = assignmentLabel(v, operatorNames);
            const nextStatus =
              v.connectivityStatus === 'online' ? 'offline' : 'online';
            const rowBusy = busyVehicleId === v.id;
            return (
              <tr key={v.id}>
                <td>{v.name}</td>
                <td>
                  <span className={`badge ${v.connectivityStatus}`}>
                    {v.connectivityStatus}
                  </span>
                </td>
                <td>
                  <span className={`badge ${assignment.className}`}>
                    {assignment.label}
                  </span>
                </td>
                <td>
                  <div className="row-actions">
                    <button
                      className="ghost"
                      onClick={() => onToggleConnectivity(v)}
                      disabled={rowBusy}
                      title={`Set ${nextStatus}`}
                    >
                      {rowBusy ? '…' : `Set ${nextStatus}`}
                    </button>
                    <button
                      className="danger"
                      onClick={() => onDelete(v)}
                      disabled={rowBusy}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
