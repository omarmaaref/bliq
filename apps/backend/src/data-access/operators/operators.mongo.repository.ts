import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
  NewOperator,
  Operator,
} from '../../domain/operators/operator.entity';
import { OperatorRepository } from '../../domain/operators/operator.repository';
import { toOperator } from './operators.mapper';
import { OperatorModel } from './operators.schema';

@Injectable()
export class OperatorsMongoRepository implements OperatorRepository {
  constructor(
    @InjectModel(OperatorModel.name)
    private readonly model: Model<OperatorModel>,
  ) {}

  async create(input: NewOperator): Promise<Operator> {
    const doc = await this.model.create({
      name: input.name,
      currentVehicleId: null,
    });
    return toOperator(doc);
  }

  async findById(id: string): Promise<Operator | null> {
    if (!Types.ObjectId.isValid(id)) return null;
    const doc = await this.model.findById(id).exec();
    return doc ? toOperator(doc) : null;
  }

  async findAll(): Promise<Operator[]> {
    const docs = await this.model.find().exec();
    return docs.map(toOperator);
  }

  async delete(id: string): Promise<boolean> {
    if (!Types.ObjectId.isValid(id)) return false;
    const res = await this.model.findByIdAndDelete(id).exec();
    return res !== null;
  }

  async claimVehicle(
    operatorId: string,
    vehicleId: string,
  ): Promise<Operator | null> {
    if (
      !Types.ObjectId.isValid(operatorId) ||
      !Types.ObjectId.isValid(vehicleId)
    ) {
      return null;
    }

    const doc = await this.model
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(operatorId),
          currentVehicleId: null,
        },
        { $set: { currentVehicleId: new Types.ObjectId(vehicleId) } },
        { new: true },
      )
      .exec();

    return doc ? toOperator(doc) : null;
  }

  async releaseVehicle(
    operatorId: string,
    vehicleId: string,
  ): Promise<Operator | null> {
    if (
      !Types.ObjectId.isValid(operatorId) ||
      !Types.ObjectId.isValid(vehicleId)
    ) {
      return null;
    }

    const doc = await this.model
      .findOneAndUpdate(
        {
          _id: new Types.ObjectId(operatorId),
          currentVehicleId: new Types.ObjectId(vehicleId),
        },
        { $set: { currentVehicleId: null } },
        { new: true },
      )
      .exec();

    return doc ? toOperator(doc) : null;
  }
}
