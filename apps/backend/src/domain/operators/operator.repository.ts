import { NewOperator, Operator } from './operator.entity';

export abstract class OperatorRepository {
  // --- CRUD ---
  abstract create(input: NewOperator): Promise<Operator>;
  abstract findById(id: string): Promise<Operator | null>;
  abstract findAll(): Promise<Operator[]>;
  abstract delete(id: string): Promise<boolean>;
}
