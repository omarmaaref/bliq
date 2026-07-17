
  export interface Operator {
    id: string;
    name: string;
    currentVehicleId: string | null;
  }

  export type NewOperator = Pick<Operator, 'name'>;