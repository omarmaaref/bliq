import { IsString, MinLength } from 'class-validator';

export class CreateVehicleDto {
  @IsString()
  @MinLength(1)
  name!: string;
}
