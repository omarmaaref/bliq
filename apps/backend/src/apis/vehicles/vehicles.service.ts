import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Vehicle } from '../../domain/vehicles/vehicle.entity';
import {
  NewVehicle,
  UpdateVehicle,
  VehicleRepository,
} from '../../domain/vehicles/vehicle.repository';
import { canGoOffline } from '../../domain/vehicles/vehicle.rules';

@Injectable()
export class VehiclesService {
  constructor(private readonly repo: VehicleRepository) {}

  create(input: NewVehicle): Promise<Vehicle> {
    if (!input.name?.trim()) {
      throw new BadRequestException('Vehicle name is required');
    }
    return this.repo.create({ name: input.name.trim() });
  }

  findAll(): Promise<Vehicle[]> {
    return this.repo.findAll();
  }

  async findById(id: string): Promise<Vehicle> {
    const vehicle = await this.repo.findById(id);
    if (!vehicle) throw new NotFoundException(`Vehicle ${id} not found`);
    return vehicle;
  }

  async update(id: string, patch: UpdateVehicle): Promise<Vehicle> {
    const updated = await this.repo.update(id, patch);
    if (!updated) throw new NotFoundException(`Vehicle ${id} not found`);
    return updated;
  }

  async delete(id: string): Promise<void> {
    const existed = await this.repo.delete(id);
    if (!existed) throw new NotFoundException(`Vehicle ${id} not found`);
  }

  async setConnectivityStatus(
    id: string,
    status: 'online' | 'offline',
  ): Promise<Vehicle> {
    const updated = await this.repo.setConnectivityStatus(id, status);
    if (updated) return updated;

    // Precondition failed or vehicle missing — diagnose:
    const current = await this.repo.findById(id);
    if (!current) throw new NotFoundException(`Vehicle ${id} not found`);
    if (status === 'offline' && !canGoOffline(current)) {
      throw new ConflictException(
        'CANNOT_OFFLINE_ASSIGNED_VEHICLE: release the vehicle first',
      );
    }
    // Shouldn't happen (going online has no preconditions).
    throw new ConflictException('Unable to update connectivity status');
  }
}
