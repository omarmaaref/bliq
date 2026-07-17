import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Vehicle } from '../../domain/vehicles/vehicle.entity';
import {
  NewVehicle,
  UpdateVehicle,
  VehicleRepository,
} from '../../domain/vehicles/vehicle.repository';
import { toVehicle } from './vehicles.mapper';
import { VehicleModel } from './vehicles.schema';

@Injectable()
export class VehiclesMongoRepository implements VehicleRepository {
  constructor(
    @InjectModel(VehicleModel.name)
    private readonly model: Model<VehicleModel>,
  ) {}

  async create(input: NewVehicle): Promise<Vehicle> {
    const doc = await this.model.create({
      name: input.name,
      connectivityStatus: 'offline',
      assignedOperatorId: null,
    });
    return toVehicle(doc);
  }

  async findById(id: string): Promise<Vehicle | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.model.findById(id).exec();
    return doc ? toVehicle(doc) : null;
  }

  async findAll(): Promise<Vehicle[]> {
    const docs = await this.model.find().exec();
    return docs.map(toVehicle);
  }

  async update(id: string, patch: UpdateVehicle): Promise<Vehicle | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.model
      .findByIdAndUpdate(id, patch, { new: true })
      .exec();
    return doc ? toVehicle(doc) : null;
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const res = await this.model.findByIdAndDelete(id).exec();
    return res !== null;
  }

  async setConnectivityStatus(
    vehicleId: string,
    status: 'online' | 'offline',
  ): Promise<Vehicle | null> {
    if (!Types.ObjectId.isValid(vehicleId)) return null;

    const filter =
      status === 'offline'
        ? { _id: new Types.ObjectId(vehicleId), assignedOperatorId: null }
        : { _id: new Types.ObjectId(vehicleId) };

    const doc = await this.model
      .findOneAndUpdate(
        filter,
        { $set: { connectivityStatus: status } },
        { new: true },
      )
      .exec();

    return doc ? toVehicle(doc) : null;
  }

  async assignOperator(
    vehicleId: string,
    operatorId: string,
  ): Promise<Vehicle | null> {
    if (
      !Types.ObjectId.isValid(vehicleId) ||
      !Types.ObjectId.isValid(operatorId)
    ) {
      return null;
    }

    const doc = await this.model
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(vehicleId),
          connectivityStatus: 'online',
          assignedOperatorId: null,
        },
        { $set: { assignedOperatorId: new Types.ObjectId(operatorId) } },
        { new: true },
      )
      .exec();

    return doc ? toVehicle(doc) : null;
  }

  async releaseFromOperator(
    vehicleId: string,
    operatorId: string,
  ): Promise<Vehicle | null> {
    if (
      !Types.ObjectId.isValid(vehicleId) ||
      !Types.ObjectId.isValid(operatorId)
    ) {
      return null;
    }

    const doc = await this.model
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(vehicleId),
          assignedOperatorId: new Types.ObjectId(operatorId),
        },
        { $set: { assignedOperatorId: null } },
        { new: true },
      )
      .exec();

    return doc ? toVehicle(doc) : null;
  }
}
