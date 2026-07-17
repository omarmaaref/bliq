import { Vehicle } from './vehicle.entity';
import { canBeAssigned, canGoOffline } from './vehicle.rules';

const vehicle = (overrides: Partial<Vehicle> = {}): Vehicle => ({
  id: 'v1',
  name: 'Rover-01',
  connectivityStatus: 'offline',
  assignedOperatorId: null,
  ...overrides,
});

describe('canBeAssigned', () => {
  it('is true when the vehicle is online AND unassigned', () => {
    expect(
      canBeAssigned(
        vehicle({ connectivityStatus: 'online', assignedOperatorId: null }),
      ),
    ).toBe(true);
  });

  it('is false when the vehicle is offline', () => {
    expect(
      canBeAssigned(
        vehicle({ connectivityStatus: 'offline', assignedOperatorId: null }),
      ),
    ).toBe(false);
  });

  it('is false when the vehicle is online but already assigned', () => {
    expect(
      canBeAssigned(
        vehicle({ connectivityStatus: 'online', assignedOperatorId: 'op1' }),
      ),
    ).toBe(false);
  });
});

describe('canGoOffline', () => {
  it('is true when the vehicle is unassigned', () => {
    expect(canGoOffline(vehicle({ assignedOperatorId: null }))).toBe(true);
  });

  it('is false when the vehicle is currently held by an operator', () => {
    expect(canGoOffline(vehicle({ assignedOperatorId: 'op1' }))).toBe(false);
  });
});
