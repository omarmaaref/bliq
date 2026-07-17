import { Operator } from '../../domain/operators/operator.entity';

const OP_ID_A = '65f9d1c4a2b7d3e4c5f6a7b9';
const OP_ID_B = '65f9d1c4a2b7d3e4c5f6a7ba';
const VEHICLE_ID = '65f9d1c4a2b7d3e4c5f6a7b8';

export const operatorFreeExample: Operator = {
  id: OP_ID_A,
  name: 'Alice Nakamura',
  currentVehicleId: null,
};

export const operatorHoldingExample: Operator = {
  id: OP_ID_B,
  name: 'Bruno Silva',
  currentVehicleId: VEHICLE_ID,
};

export const operatorListExample: Operator[] = [
  operatorFreeExample,
  operatorHoldingExample,
];

export const operatorNotFoundExample = {
  statusCode: 404,
  code: 'OPERATOR_NOT_FOUND',
  message: `Operator ${OP_ID_A} not found`,
};
