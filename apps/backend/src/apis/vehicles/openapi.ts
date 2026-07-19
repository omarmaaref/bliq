import { Vehicle } from '../../domain/vehicles/vehicle.entity';

const SAMPLE_VEHICLE_ID = '65f9d1c4a2b7d3e4c5f6a7b8';
const SAMPLE_OPERATOR_ID = '65f9d1c4a2b7d3e4c5f6a7b9';

export const vehicleOfflineExample: Vehicle = {
  id: SAMPLE_VEHICLE_ID,
  name: 'Rover-01',
  connectivityStatus: 'offline',
  assignedOperatorId: null,
};

export const vehicleOnlineFreeExample: Vehicle = {
  id: SAMPLE_VEHICLE_ID,
  name: 'Rover-01',
  connectivityStatus: 'online',
  assignedOperatorId: null,
};

export const vehicleAssignedExample: Vehicle = {
  id: SAMPLE_VEHICLE_ID,
  name: 'Rover-01',
  connectivityStatus: 'online',
  assignedOperatorId: SAMPLE_OPERATOR_ID,
};

export const vehicleListExample: Vehicle[] = [
  vehicleAssignedExample,
  vehicleOnlineFreeExample,
  vehicleOfflineExample,
];

export const createVehicleRequestExample = { name: 'Rover-01' };

export const updateVehicleRequestExample = { name: 'Rover-01-renamed' };

export const setConnectivityOnlineExample = { status: 'online' as const };
export const setConnectivityOfflineExample = { status: 'offline' as const };

export const vehicleNotFoundExample = {
  statusCode: 404,
  error: 'VEHICLE_NOT_FOUND',
  message: `Vehicle ${SAMPLE_VEHICLE_ID} not found`,
};

export const cannotOfflineAssignedExample = {
  statusCode: 409,
  error: 'CANNOT_OFFLINE_ASSIGNED_VEHICLE',
  message: 'release the vehicle first',
};

export const cannotDeleteOnlineVehicleExample = {
  statusCode: 409,
  error: 'VEHICLE_ONLINE',
  message: 'Vehicle must be taken offline before it can be deleted.',
};

export const cannotDeleteAssignedVehicleExample = {
  statusCode: 409,
  error: 'VEHICLE_STILL_ASSIGNED',
  message:
    'Vehicle is currently assigned to an operator; release it before deleting.',
};
