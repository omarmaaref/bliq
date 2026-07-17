import { Vehicle } from '../../domain/vehicles/vehicle.entity';
import { VehicleDocument } from './vehicles.schema';

export function toVehicle(doc: VehicleDocument): Vehicle {
  return {
    id: doc._id.toString(),
    name: doc.name,
    connectivityStatus: doc.connectivityStatus,
    assignedOperatorId: doc.assignedOperatorId
      ? doc.assignedOperatorId.toString()
      : null,
  };
}
