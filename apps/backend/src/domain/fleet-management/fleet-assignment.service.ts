import { Vehicle } from '../vehicles/vehicle.entity';

/**
 * Coordinates cross-aggregate operations between vehicles and operators.
 * Implementations are responsible for atomicity — both sides must mutate
 * together, or not at all.
 *
 * On rule violations, implementations throw a `DomainError` subclass from
 * `./assignment.errors`.
 */
export abstract class FleetAssignmentService {
  abstract assignOperatorToVehicle(
    operatorId: string,
    vehicleId: string,
  ): Promise<Vehicle>;

  abstract releaseOperatorFromVehicle(
    operatorId: string,
    vehicleId: string,
  ): Promise<Vehicle>;
}
