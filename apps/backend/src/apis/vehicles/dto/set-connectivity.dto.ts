import { IsIn } from 'class-validator';

export class SetConnectivityDto {
  @IsIn(['online', 'offline'])
  status!: 'online' | 'offline';
}
