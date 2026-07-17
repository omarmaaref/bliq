import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { FleetManagementModule } from './apis/fleet-management/fleet-management.module';
import { OperatorsModule } from './apis/operators/operators.module';
import { VehiclesModule } from './apis/vehicles/vehicles.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    EventEmitterModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    VehiclesModule,
    OperatorsModule,
    FleetManagementModule,
  ],
})
export class AppModule {}
