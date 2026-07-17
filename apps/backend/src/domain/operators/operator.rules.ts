import { Operator } from './operator.entity';

/**
 * An operator can claim a vehicle only when they are not already holding one.
 */
export function canClaimVehicle(operator: Operator): boolean {
  return operator.currentVehicleId === null;
}

/**
 * True when the operator is currently holding this specific vehicle. Used to
 * authorise a release request.
 */
export function isHolding(operator: Operator, vehicleId: string): boolean {
  return operator.currentVehicleId === vehicleId;
}
