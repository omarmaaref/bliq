import { IsMongoId } from 'class-validator';

export class TakeoverDto {
  @IsMongoId()
  operatorId!: string;

  @IsMongoId()
  vehicleId!: string;
}
