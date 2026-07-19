import { DomainError } from '../shared/domain.error';

export class VehicleOnlineError extends DomainError {
  readonly code = 'VEHICLE_ONLINE';
  readonly kind = 'conflict' as const;

  constructor() {
    super('Vehicle must be taken offline before it can be deleted.');
  }
}

export class VehicleStillAssignedError extends DomainError {
  readonly code = 'VEHICLE_STILL_ASSIGNED';
  readonly kind = 'conflict' as const;

  constructor() {
    super(
      'Vehicle is currently assigned to an operator; release it before deleting.',
    );
  }
}
