import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiHeader,
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
import { OPERATOR_ID_HEADER, OperatorId } from './operator-id.decorator';

@ApiTags('fleet-management')
@ApiHeader({
  name: OPERATOR_ID_HEADER,
  description: 'Id of the remote operator performing the action.',
  required: true,
  example: '65f9d1c4a2b7d3e4c5f6a7b9',
})
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
  takeover(
    @OperatorId() operatorId: string,
    @Body() dto: TakeoverDto,
  ): Promise<Vehicle> {
    return this.assignments.assignOperatorToVehicle(operatorId, dto.vehicleId);
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
  release(
    @OperatorId() operatorId: string,
    @Body() dto: TakeoverDto,
  ): Promise<Vehicle> {
    return this.assignments.releaseOperatorFromVehicle(operatorId, dto.vehicleId);
  }
}
