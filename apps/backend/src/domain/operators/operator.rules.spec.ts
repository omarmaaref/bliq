import { Operator } from './operator.entity';
import { canClaimVehicle, isHolding } from './operator.rules';

const operator = (overrides: Partial<Operator> = {}): Operator => ({
  id: 'op1',
  name: 'Alice',
  currentVehicleId: null,
  ...overrides,
});

describe('canClaimVehicle', () => {
  it('is true when the operator holds no vehicle', () => {
    expect(canClaimVehicle(operator({ currentVehicleId: null }))).toBe(true);
  });

  it('is false when the operator is already holding a vehicle', () => {
    expect(canClaimVehicle(operator({ currentVehicleId: 'v1' }))).toBe(false);
  });
});

describe('isHolding', () => {
  it('is true when the operator currently holds the given vehicle', () => {
    expect(isHolding(operator({ currentVehicleId: 'v1' }), 'v1')).toBe(true);
  });

  it('is false when the operator holds a different vehicle', () => {
    expect(isHolding(operator({ currentVehicleId: 'v2' }), 'v1')).toBe(false);
  });

  it('is false when the operator holds no vehicle', () => {
    expect(isHolding(operator({ currentVehicleId: null }), 'v1')).toBe(false);
  });
});
