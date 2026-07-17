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
import { VehiclesService } from './vehicles.service';
import { Vehicle } from '../../domain/vehicles/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { SetConnectivityDto } from './dto/set-connectivity.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';

@Controller('vehicles')
export class VehiclesController {
  constructor(private readonly service: VehiclesService) {}

  @Post()
  create(@Body() dto: CreateVehicleDto): Promise<Vehicle> {
    return this.service.create(dto);
  }

  @Get()
  findAll(): Promise<Vehicle[]> {
    return this.service.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string): Promise<Vehicle> {
    return this.service.findById(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateVehicleDto,
  ): Promise<Vehicle> {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(204)
  async remove(@Param('id') id: string): Promise<void> {
    await this.service.delete(id);
  }

  @Patch(':id/connectivity')
  setConnectivity(
    @Param('id') id: string,
    @Body() dto: SetConnectivityDto,
  ): Promise<Vehicle> {
    return this.service.setConnectivityStatus(id, dto.status);
  }
}
