import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { HydratedDocument, Types } from 'mongoose';

export type VehicleDocument = HydratedDocument<VehicleModel>;

@Schema({ collection: 'vehicles', timestamps: true })
export class VehicleModel {
  @Prop({ required: true, trim: true })
  name!: string;

  @Prop({ required: true, enum: ['online', 'offline'], default: 'offline' })
  connectivityStatus!: 'online' | 'offline';

  @Prop({ type: Types.ObjectId, ref: 'OperatorModel', default: null })
  assignedOperatorId!: Types.ObjectId | null;
}

export const VehicleSchema = SchemaFactory.createForClass(VehicleModel);

// VehicleSchema.index(
//   { assignedOperatorId: 1 },
//   {
//     unique: true,
//     partialFilterExpression: { assignedOperatorId: { $type: 'objectId' } },
//   },
// );
