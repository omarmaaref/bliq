import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MinLength } from 'class-validator';

export class UpdateVehicleDto {
  @ApiPropertyOptional({ example: 'Rover-01-renamed' })
  @IsOptional()
  @IsString()
  @MinLength(1)
  name?: string;
}
