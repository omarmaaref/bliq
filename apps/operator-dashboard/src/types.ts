export type Vehicle = {
  id: string;
  name: string;
  connectivityStatus: 'online' | 'offline';
  assignedOperatorId: string | null;
};

export type Operator = {
  id: string;
  name: string;
  currentVehicleId: string | null;
};

export type ApiErrorBody = {
  statusCode: number;
  error: string;
  message: string;
};

export type VehicleChangeKind = 'created' | 'updated' | 'deleted';

export type VehicleChangedEvent = {
  kind: VehicleChangeKind;
  vehicleId: string;
  vehicle: Vehicle | null;
};

/** Payload of the `vehicles.snapshot` event sent on WebSocket connect. */
export type VehiclesSnapshot = {
  vehicles: Vehicle[];
  /** Backend instance the client is currently connected to. */
  instanceId: string;
};

export type SyncMode = 'polling' | 'websocket';

export class ApiError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}
