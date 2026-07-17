import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { OperatorsModule } from './apis/operators/operators.module';
import { VehiclesModule } from './apis/vehicles/vehicles.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    MongooseModule.forRoot(process.env.MONGODB_URI!),
    VehiclesModule,
    OperatorsModule,
  ],
})
export class AppModule {}
