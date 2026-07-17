import { ApiProperty } from '@nestjs/swagger';
import { IsString, MinLength } from 'class-validator';

export class CreateVehicleDto {
  @ApiProperty({ example: 'Rover-01', description: 'Human-readable vehicle name.' })
  @IsString()
  @MinLength(1)
  name!: string;
}
