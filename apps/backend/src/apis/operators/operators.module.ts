import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { OperatorsMongoRepository } from '../../data-access/operators/operators.mongo.repository';
import {
  OperatorModel,
  OperatorSchema,
} from '../../data-access/operators/operators.schema';
import { OperatorRepository } from '../../domain/operators/operator.repository';
import { OperatorsController } from './operators.controller';
import { OperatorsSeed } from './operators.seed';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: OperatorModel.name, schema: OperatorSchema },
    ]),
  ],
  controllers: [OperatorsController],
  providers: [
    { provide: OperatorRepository, useClass: OperatorsMongoRepository },
    OperatorsSeed,
  ],
  exports: [OperatorRepository, MongooseModule],
})
export class OperatorsModule {}
