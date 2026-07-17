import { ApiProperty } from '@nestjs/swagger';
import { IsIn } from 'class-validator';

export class SetConnectivityDto {
  @ApiProperty({
    enum: ['online', 'offline'],
    example: 'online',
    description:
      'Target connectivity state. Going offline is rejected while the vehicle is assigned.',
  })
  @IsIn(['online', 'offline'])
  status!: 'online' | 'offline';
}
