import { Injectable } from '@nestjs/common';
import { InjectConnection, InjectModel } from '@nestjs/mongoose';
import { Connection, Model, Types } from 'mongoose';
import {
  OperatorAlreadyHasVehicleError,
  OperatorNotFoundError,
  VehicleAlreadyAssignedError,
  VehicleNotFoundError,
  VehicleNotHeldByOperatorError,
  VehicleOfflineError,
} from '../../domain/fleet-management/assignment.errors';
import { FleetAssignmentService } from '../../domain/fleet-management/fleet-assignment.service';
import {
  canClaimVehicle,
  isHolding,
} from '../../domain/operators/operator.rules';
import { Vehicle } from '../../domain/vehicles/vehicle.entity';
import { canBeAssigned } from '../../domain/vehicles/vehicle.rules';
import { toOperator } from '../../data-access/operators/operators.mapper';
import { OperatorModel } from '../../data-access/operators/operators.schema';
import { toVehicle } from '../../data-access/vehicles/vehicles.mapper';
import { VehicleModel } from '../../data-access/vehicles/vehicles.schema';

@Injectable()
export class MongoFleetAssignmentService implements FleetAssignmentService {
  constructor(
    @InjectConnection() private readonly connection: Connection,
    @InjectModel(VehicleModel.name)
    private readonly vehicleModel: Model<VehicleModel>,
    @InjectModel(OperatorModel.name)
    private readonly operatorModel: Model<OperatorModel>,
  ) {}

  async assignOperatorToVehicle(
    operatorId: string,
    vehicleId: string,
  ): Promise<Vehicle> {
    if (!Types.ObjectId.isValid(vehicleId)) {
      throw new VehicleNotFoundError(vehicleId);
    }
    if (!Types.ObjectId.isValid(operatorId)) {
      throw new OperatorNotFoundError(operatorId);
    }

    const vehicleObjectId = new Types.ObjectId(vehicleId);
    const operatorObjectId = new Types.ObjectId(operatorId);

    const session = await this.connection.startSession();
    try {
      return await session.withTransaction(async () => {
        const operatorDoc = await this.operatorModel
          .findById(operatorObjectId)
          .session(session)
          .exec();
        const vehicleDoc = await this.vehicleModel
          .findById(vehicleObjectId)
          .session(session)
          .exec();

        if (!operatorDoc) throw new OperatorNotFoundError(operatorId);
        if (!vehicleDoc) throw new VehicleNotFoundError(vehicleId);

        const operator = toOperator(operatorDoc);
        const vehicle = toVehicle(vehicleDoc);

        if (!canClaimVehicle(operator)) {
          throw new OperatorAlreadyHasVehicleError();
        }
        if (vehicle.connectivityStatus === 'offline') {
          throw new VehicleOfflineError();
        }
        if (!canBeAssigned(vehicle)) {
          throw new VehicleAlreadyAssignedError();
        }

        operatorDoc.currentVehicleId = vehicleObjectId;
        vehicleDoc.assignedOperatorId = operatorObjectId;
        await operatorDoc.save({ session });
        await vehicleDoc.save({ session });

        return toVehicle(vehicleDoc);
      });
    } finally {
      await session.endSession();
    }
  }

  async releaseOperatorFromVehicle(
    operatorId: string,
    vehicleId: string,
  ): Promise<Vehicle> {
    if (!Types.ObjectId.isValid(vehicleId)) {
      throw new VehicleNotFoundError(vehicleId);
    }
    if (!Types.ObjectId.isValid(operatorId)) {
      throw new OperatorNotFoundError(operatorId);
    }

    const vehicleObjectId = new Types.ObjectId(vehicleId);
    const operatorObjectId = new Types.ObjectId(operatorId);

    const session = await this.connection.startSession();
    try {
      return await session.withTransaction(async () => {
        const operatorDoc = await this.operatorModel
          .findById(operatorObjectId)
          .session(session)
          .exec();
        const vehicleDoc = await this.vehicleModel
          .findById(vehicleObjectId)
          .session(session)
          .exec();

        if (!operatorDoc) throw new OperatorNotFoundError(operatorId);
        if (!vehicleDoc) throw new VehicleNotFoundError(vehicleId);

        const operator = toOperator(operatorDoc);

        if (!isHolding(operator, vehicleId)) {
          throw new VehicleNotHeldByOperatorError();
        }

        operatorDoc.currentVehicleId = null;
        vehicleDoc.assignedOperatorId = null;
        await operatorDoc.save({ session });
        await vehicleDoc.save({ session });

        return toVehicle(vehicleDoc);
      });
    } finally {
      await session.endSession();
    }
  }
}
