import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { FleetAssignmentService } from '../../domain/fleet-management/fleet-assignment.service';
import { Vehicle } from '../../domain/vehicles/vehicle.entity';
import { TakeoverDto } from './dto/takeover.dto';

@Controller('fleet-management')
export class FleetManagementController {
  constructor(private readonly assignments: FleetAssignmentService) {}

  @Post('takeover')
  @HttpCode(200)
  takeover(@Body() dto: TakeoverDto): Promise<Vehicle> {
    return this.assignments.assignOperatorToVehicle(dto.operatorId, dto.vehicleId);
  }

  @Post('release')
  @HttpCode(200)
  release(@Body() dto: TakeoverDto): Promise<Vehicle> {
    return this.assignments.releaseOperatorFromVehicle(dto.operatorId, dto.vehicleId);
  }
}
