import { ApiProperty } from '@nestjs/swagger';
import { IsMongoId } from 'class-validator';

export class TakeoverDto {
  @ApiProperty({
    example: '65f9d1c4a2b7d3e4c5f6a7b8',
    description: 'Id of the vehicle being taken over or released.',
  })
  @IsMongoId()
  vehicleId!: string;
}
