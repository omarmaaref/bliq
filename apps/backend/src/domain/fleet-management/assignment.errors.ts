import { DomainError } from '../shared/domain.error';

export class VehicleNotFoundError extends DomainError {
  readonly code = 'VEHICLE_NOT_FOUND';
  constructor(vehicleId: string) {
    super(`Vehicle ${vehicleId} not found`);
  }
}

export class OperatorNotFoundError extends DomainError {
  readonly code = 'OPERATOR_NOT_FOUND';
  constructor(operatorId: string) {
    super(`Operator ${operatorId} not found`);
  }
}

export class VehicleOfflineError extends DomainError {
  readonly code = 'VEHICLE_OFFLINE';
  constructor() {
    super('Only online vehicles can be taken over');
  }
}

export class VehicleAlreadyAssignedError extends DomainError {
  readonly code = 'VEHICLE_ALREADY_ASSIGNED';
  constructor() {
    super('Another operator is holding this vehicle');
  }
}

export class OperatorAlreadyHasVehicleError extends DomainError {
  readonly code = 'OPERATOR_ALREADY_HAS_VEHICLE';
  constructor() {
    super('Operator is already holding a vehicle; release it first');
  }
}

export class VehicleNotHeldByOperatorError extends DomainError {
  readonly code = 'VEHICLE_NOT_HELD_BY_OPERATOR';
  constructor() {
    super('Operator is not holding this vehicle');
  }
}
