import { Vehicle } from './vehicle.entity';

export type NewVehicle = Pick<Vehicle, 'name'>;
export type UpdateVehicle = Partial<Pick<Vehicle, 'name'>>;

export abstract class VehicleRepository {
  // --- CRUD ---
  abstract create(input: NewVehicle): Promise<Vehicle>;
  abstract findById(id: string): Promise<Vehicle | null>;
  abstract findAll(): Promise<Vehicle[]>;
  abstract update(id: string, patch: UpdateVehicle): Promise<Vehicle | null>;
  abstract delete(id: string): Promise<boolean>;

  // --- guarded operations (atomic; return null on precondition failure) ---

  /** Going offline requires the vehicle to be unassigned. Going online is always allowed. */
  abstract setConnectivityStatus(
    vehicleId: string,
    status: 'online' | 'offline',
  ): Promise<Vehicle | null>;
}
