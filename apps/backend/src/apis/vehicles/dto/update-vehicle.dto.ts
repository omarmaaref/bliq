import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateVehicleDto {
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}
