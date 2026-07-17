import { Vehicle } from './vehicle.entity';

export type VehicleChangeKind = 'created' | 'updated' | 'deleted';

/**
 * Coarse-grained "something changed about a vehicle" event. Emitted whenever
 * the vehicles collection is mutated — via the API or by any other writer.
 *
 * Subscribers receive the current state on create/update, or null on delete
 * (only the id is meaningful there).
 */
export type VehicleChangedEvent = {
  kind: VehicleChangeKind;
  vehicleId: string;
  vehicle: Vehicle | null;
};

export const VEHICLE_CHANGED_EVENT = 'vehicle.changed';
