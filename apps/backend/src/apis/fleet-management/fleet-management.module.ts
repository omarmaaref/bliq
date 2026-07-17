import { Module } from '@nestjs/common';
import { FleetAssignmentService } from '../../domain/fleet-management/fleet-assignment.service';
import { MongoFleetAssignmentService } from '../../services/fleet-management/mongo-fleet-assignment.service';
import { OperatorsModule } from '../operators/operators.module';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { FleetManagementController } from './fleet-management.controller';

@Module({
  imports: [VehiclesModule, OperatorsModule],
  controllers: [FleetManagementController],
  providers: [
    {
      provide: FleetAssignmentService,
      useClass: MongoFleetAssignmentService,
    },
  ],
})
export class FleetManagementModule {}
