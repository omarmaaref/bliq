import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { MongooseModule } from '@nestjs/mongoose';
import { FleetManagementModule } from './apis/fleet-management/fleet-management.module';
import { HealthModule } from './apis/health/health.module';
import { MetricsModule } from './apis/metrics/metrics.module';
import { OperatorsModule } from './apis/operators/operators.module';
import { VehiclesModule } from './apis/vehicles/vehicles.module';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot(),
    EventEmitterModule.forRoot(),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    HealthModule,
    MetricsModule,
    VehiclesModule,
    OperatorsModule,
    FleetManagementModule,
  ],
})
export class AppModule {}
