import { Vehicle } from './vehicle.entity';

/**
 * A vehicle is eligible to be taken over when it is online AND not currently
 * assigned to anyone.
 */
export function canBeAssigned(vehicle: Vehicle): boolean {
  return (
    vehicle.connectivityStatus === 'online' &&
    vehicle.assignedOperatorId === null
  );
}

/**
 * A vehicle can only go offline when no operator holds it — an operator must
 * release it first.
 */
export function canGoOffline(vehicle: Vehicle): boolean {
  return vehicle.assignedOperatorId === null;
}
