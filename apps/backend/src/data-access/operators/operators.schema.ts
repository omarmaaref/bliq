import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type OperatorDocument = HydratedDocument<OperatorModel>;

@Schema({ collection: 'operators', timestamps: true })
export class OperatorModel {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ type: Types.ObjectId, ref: 'VehicleModel', default: null })
  currentVehicleId!: Types.ObjectId | null;
}

export const OperatorSchema = SchemaFactory.createForClass(OperatorModel);
