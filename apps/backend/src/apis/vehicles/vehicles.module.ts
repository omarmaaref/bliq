import { forwardRef, Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { VehicleChangeStreamWatcher } from '../../data-access/vehicles/vehicle-change-stream.watcher';
import { VehiclesMongoRepository } from '../../data-access/vehicles/vehicles.mongo.repository';
import {
  VehicleModel,
  VehicleSchema,
} from '../../data-access/vehicles/vehicles.schema';
import { VehicleRepository } from '../../domain/vehicles/vehicle.repository';
import { VehiclesController } from './vehicles.controller';
import { VehiclesGateway } from './vehicles.gateway';
import { VehiclesService } from './vehicles.service';
import { OperatorsModule } from '../operators/operators.module';
import { FleetManagementModule } from '../fleet-management/fleet-management.module';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: VehicleModel.name, schema: VehicleSchema },
    ]),
    OperatorsModule,
    forwardRef(() => FleetManagementModule),
  ],
  controllers: [VehiclesController],
  providers: [
    VehiclesService,
    { provide: VehicleRepository, useClass: VehiclesMongoRepository },

    VehicleChangeStreamWatcher,
    VehiclesGateway,
  ],
  exports: [VehicleRepository, MongooseModule],
})
export class VehiclesModule {}
