import { Operator } from '../../domain/operators/operator.entity';
import { OperatorDocument } from './operators.schema';

export function toOperator(doc: OperatorDocument): Operator {
  return {
    id: doc._id.toString(),
    name: doc.name,
    currentVehicleId: doc.currentVehicleId
      ? doc.currentVehicleId.toString()
      : null,
  };
}
