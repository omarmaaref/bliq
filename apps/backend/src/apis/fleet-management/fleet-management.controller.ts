import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { FleetAssignmentService } from '../../domain/fleet-management/fleet-assignment.service';
import { Vehicle } from '../../domain/vehicles/vehicle.entity';
import { TakeoverDto } from './dto/takeover.dto';
import {
  notFoundErrorExample,
  operatorAlreadyHasVehicleErrorExample,
  releaseSuccessExample,
  takeoverSuccessExample,
  vehicleAlreadyAssignedErrorExample,
  vehicleNotHeldByOperatorErrorExample,
  vehicleOfflineErrorExample,
} from './openapi';

@ApiTags('fleet-management')
@Controller('fleet-management')
export class FleetManagementController {
  constructor(private readonly assignments: FleetAssignmentService) {}

  @Post('takeover')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Operator takes over a vehicle.',
    description:
      'Atomic across the operator and vehicle documents. Rejects with a domain error code if the vehicle is offline, the vehicle is already assigned, or the operator is already holding another vehicle.',
  })
  @ApiOkResponse({
    description: 'The vehicle after successful assignment.',
    example: takeoverSuccessExample,
  })
  @ApiNotFoundResponse({ example: notFoundErrorExample })
  @ApiConflictResponse({
    description: 'Rule violation. See `code` for the specific reason.',
    schema: {
      oneOf: [
        { example: vehicleOfflineErrorExample },
        { example: vehicleAlreadyAssignedErrorExample },
        { example: operatorAlreadyHasVehicleErrorExample },
      ],
    },
  })
  takeover(@Body() dto: TakeoverDto): Promise<Vehicle> {
    return this.assignments.assignOperatorToVehicle(
      dto.operatorId,
      dto.vehicleId,
    );
  }

  @Post('release')
  @HttpCode(200)
  @ApiOperation({
    summary: 'Operator releases a vehicle they currently hold.',
    description:
      'Atomic across both documents. Rejects if the operator is not currently holding this vehicle.',
  })
  @ApiOkResponse({
    description: 'The vehicle after successful release.',
    example: releaseSuccessExample,
  })
  @ApiNotFoundResponse({ example: notFoundErrorExample })
  @ApiConflictResponse({ example: vehicleNotHeldByOperatorErrorExample })
  release(@Body() dto: TakeoverDto): Promise<Vehicle> {
    return this.assignments.releaseOperatorFromVehicle(
      dto.operatorId,
      dto.vehicleId,
    );
  }
}
