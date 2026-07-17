import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VehiclesService } from './vehicles.service';
import { VehiclesMongoRepository } from '../../data-access/vehicles/vehicles.mongo.repository';
import {
  VehicleModel,
  VehicleSchema,
} from '../../data-access/vehicles/vehicles.schema';
import { VehicleRepository } from '../../domain/vehicles/vehicle.repository';
import { VehiclesController } from './vehicles.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VehicleModel.name, schema: VehicleSchema },
    ]),
  ],
  controllers: [VehiclesController],
  providers: [
    VehiclesService,
    { provide: VehicleRepository, useClass: VehiclesMongoRepository },
  ],
  exports: [VehicleRepository, MongooseModule],
})
export class VehiclesModule {}
