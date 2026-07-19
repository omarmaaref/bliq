import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import {
  ApiConflictResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { Vehicle } from '../../domain/vehicles/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { SetConnectivityDto } from './dto/set-connectivity.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import {
  cannotDeleteAssignedVehicleExample,
  cannotDeleteOnlineVehicleExample,
  cannotOfflineAssignedExample,
  vehicleAssignedExample,
  vehicleListExample,
  vehicleNotFoundExample,
  vehicleOfflineExample,
  vehicleOnlineFreeExample,
} from './openapi';
import { VehiclesService } from './vehicles.service';

@ApiTags('vehicles')
@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Post()
  @ApiOperation({
    summary: 'Create a vehicle (defaults to offline & unassigned).',
  })
  @ApiOkResponse({
    description: 'The created vehicle.',
    example: vehicleOfflineExample,
  })
  create(@Body() dto: CreateVehicleDto): Promise<Vehicle> {
    return this.service.create(dto);
  }

  @Get()
  @ApiOperation({ summary: 'List all vehicles.' })
  @ApiOkResponse({ description: 'All vehicles.', example: vehicleListExample })
  findAll(): Promise<Vehicle[]> {
    return this.service.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Fetch a single vehicle by id.' })
  @ApiParam({ name: 'id', example: vehicleOnlineFreeExample.id })
  @ApiOkResponse({ example: vehicleOnlineFreeExample })
  @ApiNotFoundResponse({ example: vehicleNotFoundExample })
  findOne(@Param('id') id: string): Promise<Vehicle> {
    return this.service.findById(id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Rename a vehicle.' })
  @ApiParam({ name: 'id', example: vehicleOnlineFreeExample.id })
  @ApiOkResponse({
    example: { ...vehicleOnlineFreeExample, name: 'Rover-01-renamed' },
  })
  @ApiNotFoundResponse({ example: vehicleNotFoundExample })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  @ApiOperation({
    summary: 'Delete a vehicle.',
    description:
      'Rejected while the vehicle is online or assigned — take it offline and release it first.',
  })
  @ApiParam({ name: 'id', example: vehicleOnlineFreeExample.id })
  @ApiNotFoundResponse({ example: vehicleNotFoundExample })
  @ApiConflictResponse({
    description: 'Vehicle is online or still assigned.',
    examples: {
      online: {
        summary: 'Vehicle is online',
        value: cannotDeleteOnlineVehicleExample,
      },
      assigned: {
        summary: 'Vehicle is assigned',
        value: cannotDeleteAssignedVehicleExample,
      },
    },
  })
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.delete(id);
  }

  @Patch(':id/connectivity')
  @ApiOperation({
    summary: 'Toggle connectivity between online and offline.',
    description:
      'Going offline is rejected while an operator holds the vehicle — release it first.',
  })
  @ApiParam({ name: 'id', example: vehicleAssignedExample.id })
  @ApiOkResponse({
    description: 'Vehicle after the connectivity change.',
    example: vehicleOnlineFreeExample,
  })
  @ApiNotFoundResponse({ example: vehicleNotFoundExample })
  @ApiConflictResponse({ example: cannotOfflineAssignedExample })
  setConnectivity(
    @Param('id') id: string,
    @Body() dto: SetConnectivityDto,
  ): Promise<Vehicle> {
    return this.service.setConnectivityStatus(id, dto.status);
  }
}
