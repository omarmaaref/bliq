import { Vehicle } from '../../domain/vehicles/vehicle.entity';

const VEHICLE_ID = '65f9d1c4a2b7d3e4c5f6a7b8';
const OPERATOR_ID = '65f9d1c4a2b7d3e4c5f6a7b9';

export const takeoverRequestExample = {
  operatorId: OPERATOR_ID,
  vehicleId: VEHICLE_ID,
};

export const releaseRequestExample = {
  operatorId: OPERATOR_ID,
  vehicleId: VEHICLE_ID,
};

export const takeoverSuccessExample: Vehicle = {
  id: VEHICLE_ID,
  name: 'Rover-01',
  connectivityStatus: 'online',
  assignedOperatorId: OPERATOR_ID,
};

export const releaseSuccessExample: Vehicle = {
  id: VEHICLE_ID,
  name: 'Rover-01',
  connectivityStatus: 'online',
  assignedOperatorId: null,
};

export const vehicleOfflineErrorExample = {
  statusCode: 409,
  code: 'VEHICLE_OFFLINE',
  message: 'Only online vehicles can be taken over',
};

export const vehicleAlreadyAssignedErrorExample = {
  statusCode: 409,
  code: 'VEHICLE_ALREADY_ASSIGNED',
  message: 'Another operator is holding this vehicle',
};

export const operatorAlreadyHasVehicleErrorExample = {
  statusCode: 409,
  code: 'OPERATOR_ALREADY_HAS_VEHICLE',
  message: 'Operator is already holding a vehicle; release it first',
};

export const vehicleNotHeldByOperatorErrorExample = {
  statusCode: 409,
  code: 'VEHICLE_NOT_HELD_BY_OPERATOR',
  message: 'Operator is not holding this vehicle',
};

export const notFoundErrorExample = {
  statusCode: 404,
  code: 'VEHICLE_NOT_FOUND',
  message: `Vehicle ${VEHICLE_ID} not found`,
};
