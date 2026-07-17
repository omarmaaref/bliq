import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { Test, TestingModule } from '@nestjs/testing';
import { MongoMemoryReplSet } from 'mongodb-memory-server';
import { Connection, Model, Types } from 'mongoose';
import {
  OperatorAlreadyHasVehicleError,
  OperatorNotFoundError,
  VehicleAlreadyAssignedError,
  VehicleNotFoundError,
  VehicleNotHeldByOperatorError,
  VehicleOfflineError,
} from '../../domain/fleet-management/assignment.errors';
import { FleetAssignmentService } from '../../domain/fleet-management/fleet-assignment.service';
import {
  OperatorModel,
  OperatorSchema,
} from '../../data-access/operators/operators.schema';
import {
  VehicleModel,
  VehicleSchema,
} from '../../data-access/vehicles/vehicles.schema';
import { MongoFleetAssignmentService } from './mongo-fleet-assignment.service';

/**
 * Integration test for the full takeover / release lifecycle.
 *
 * Runs against a real single-node MongoDB replica set (mongodb-memory-server),
 * because the only thing worth proving here is what the atomic transaction
 * guarantees under concurrency — which no fake can express.
 */
describe('MongoFleetAssignmentService (integration)', () => {
  let replSet: MongoMemoryReplSet;
  let module: TestingModule;
  let connection: Connection;
  let vehicles: Model<VehicleModel>;
  let operators: Model<OperatorModel>;
  let service: FleetAssignmentService;

  beforeAll(async () => {
    replSet = await MongoMemoryReplSet.create({
      replSet: { count: 1, storageEngine: 'wiredTiger' },
    });
    const uri = replSet.getUri();

    module = await Test.createTestingModule({
      imports: [
        MongooseModule.forRoot(uri),
        MongooseModule.forFeature([
          { name: VehicleModel.name, schema: VehicleSchema },
          { name: OperatorModel.name, schema: OperatorSchema },
        ]),
      ],
      providers: [
        {
          provide: FleetAssignmentService,
          useClass: MongoFleetAssignmentService,
        },
      ],
    }).compile();

    connection = module.get<Connection>(getConnectionToken());
    vehicles = connection.model<VehicleModel>(VehicleModel.name);
    operators = connection.model<OperatorModel>(OperatorModel.name);
    service = module.get(FleetAssignmentService);
  }, 60_000);

  afterAll(async () => {
    await module?.close();
    await replSet?.stop();
  });

  beforeEach(async () => {
    await vehicles.deleteMany({});
    await operators.deleteMany({});
  });

  // Helpers to fabricate DB state directly, bypassing the CRUD API — this test
  // is about the assignment lifecycle, not about vehicle creation.
  const seedVehicle = async (
    overrides: Partial<{
      connectivityStatus: 'online' | 'offline';
      assignedOperatorId: Types.ObjectId | null;
    }> = {},
  ): Promise<string> => {
    const doc = await vehicles.create({
      name: 'Rover',
      connectivityStatus: 'online',
      assignedOperatorId: null,
      ...overrides,
    });
    return doc._id.toString();
  };

  const seedOperator = async (
    overrides: Partial<{ currentVehicleId: Types.ObjectId | null }> = {},
  ): Promise<string> => {
    const doc = await operators.create({
      name: 'Alice',
      currentVehicleId: null,
      ...overrides,
    });
    return doc._id.toString();
  };

  describe('assignOperatorToVehicle (takeover)', () => {
    it('assigns both sides when the vehicle is online and both parties are free', async () => {
      const vehicleId = await seedVehicle();
      const operatorId = await seedOperator();

      const result = await service.assignOperatorToVehicle(
        operatorId,
        vehicleId,
      );

      expect(result).toMatchObject({
        id: vehicleId,
        connectivityStatus: 'online',
        assignedOperatorId: operatorId,
      });

      const opDoc = await operators.findById(operatorId).lean();
      expect(opDoc?.currentVehicleId?.toString()).toBe(vehicleId);
    });

    it('rejects when the vehicle is offline (VEHICLE_OFFLINE), state unchanged', async () => {
      const vehicleId = await seedVehicle({ connectivityStatus: 'offline' });
      const operatorId = await seedOperator();

      await expect(
        service.assignOperatorToVehicle(operatorId, vehicleId),
      ).rejects.toBeInstanceOf(VehicleOfflineError);

      const [v, o] = await Promise.all([
        vehicles.findById(vehicleId).lean(),
        operators.findById(operatorId).lean(),
      ]);
      expect(v?.assignedOperatorId).toBeNull();
      expect(o?.currentVehicleId).toBeNull();
    });

    it('rejects when the vehicle is already assigned (VEHICLE_ALREADY_ASSIGNED), state unchanged', async () => {
      const holderId = await seedOperator();
      const vehicleId = await seedVehicle({
        assignedOperatorId: new Types.ObjectId(holderId),
      });
      // Keep the operators in sync (holder currently holds the vehicle).
      await operators.updateOne(
        { _id: new Types.ObjectId(holderId) },
        { $set: { currentVehicleId: new Types.ObjectId(vehicleId) } },
      );
      const challengerId = await seedOperator({ currentVehicleId: null });

      await expect(
        service.assignOperatorToVehicle(challengerId, vehicleId),
      ).rejects.toBeInstanceOf(VehicleAlreadyAssignedError);

      const [v, holder, challenger] = await Promise.all([
        vehicles.findById(vehicleId).lean(),
        operators.findById(holderId).lean(),
        operators.findById(challengerId).lean(),
      ]);
      expect(v?.assignedOperatorId?.toString()).toBe(holderId);
      expect(holder?.currentVehicleId?.toString()).toBe(vehicleId);
      expect(challenger?.currentVehicleId).toBeNull();
    });

    it('rejects when the operator is already holding a vehicle (OPERATOR_ALREADY_HAS_VEHICLE), state unchanged', async () => {
      const otherVehicleId = await seedVehicle();
      const operatorId = await seedOperator({
        currentVehicleId: new Types.ObjectId(otherVehicleId),
      });
      const targetVehicleId = await seedVehicle();

      await expect(
        service.assignOperatorToVehicle(operatorId, targetVehicleId),
      ).rejects.toBeInstanceOf(OperatorAlreadyHasVehicleError);

      const [target, op] = await Promise.all([
        vehicles.findById(targetVehicleId).lean(),
        operators.findById(operatorId).lean(),
      ]);
      expect(target?.assignedOperatorId).toBeNull();
      expect(op?.currentVehicleId?.toString()).toBe(otherVehicleId);
    });

    it('throws VehicleNotFoundError for an unknown vehicle id', async () => {
      const operatorId = await seedOperator();
      const unknownVehicleId = new Types.ObjectId().toString();

      await expect(
        service.assignOperatorToVehicle(operatorId, unknownVehicleId),
      ).rejects.toBeInstanceOf(VehicleNotFoundError);
    });

    it('throws OperatorNotFoundError for an unknown operator id', async () => {
      const vehicleId = await seedVehicle();
      const unknownOperatorId = new Types.ObjectId().toString();

      await expect(
        service.assignOperatorToVehicle(unknownOperatorId, vehicleId),
      ).rejects.toBeInstanceOf(OperatorNotFoundError);
    });

    it('serialises concurrent takeovers of the same vehicle: exactly one wins', async () => {
      const vehicleId = await seedVehicle();
      const operatorA = await seedOperator();
      const operatorB = await seedOperator();

      const results = await Promise.allSettled([
        service.assignOperatorToVehicle(operatorA, vehicleId),
        service.assignOperatorToVehicle(operatorB, vehicleId),
      ]);

      const successes = results.filter((r) => r.status === 'fulfilled');
      const failures = results.filter((r) => r.status === 'rejected');
      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);
      expect((failures[0] as PromiseRejectedResult).reason).toBeInstanceOf(
        VehicleAlreadyAssignedError,
      );

      const finalVehicle = await vehicles.findById(vehicleId).lean();
      const winnerId = (
        successes[0] as PromiseFulfilledResult<{ assignedOperatorId: string }>
      ).value.assignedOperatorId;
      expect(finalVehicle?.assignedOperatorId?.toString()).toBe(winnerId);

      // The losing operator must not have been mutated.
      const loserId = winnerId === operatorA ? operatorB : operatorA;
      const loser = await operators.findById(loserId).lean();
      expect(loser?.currentVehicleId).toBeNull();
    });

    it('serialises one operator racing to take two different vehicles: exactly one wins', async () => {
      const operatorId = await seedOperator();
      const vehicleA = await seedVehicle();
      const vehicleB = await seedVehicle();

      const results = await Promise.allSettled([
        service.assignOperatorToVehicle(operatorId, vehicleA),
        service.assignOperatorToVehicle(operatorId, vehicleB),
      ]);

      const successes = results.filter((r) => r.status === 'fulfilled');
      const failures = results.filter((r) => r.status === 'rejected');
      expect(successes).toHaveLength(1);
      expect(failures).toHaveLength(1);
      expect((failures[0] as PromiseRejectedResult).reason).toBeInstanceOf(
        OperatorAlreadyHasVehicleError,
      );

      // The operator holds exactly the winning vehicle.
      const winnerVehicleId = (
        successes[0] as PromiseFulfilledResult<{ id: string }>
      ).value.id;
      const op = await operators.findById(operatorId).lean();
      expect(op?.currentVehicleId?.toString()).toBe(winnerVehicleId);

      // The losing vehicle must remain unassigned.
      const loserVehicleId = winnerVehicleId === vehicleA ? vehicleB : vehicleA;
      const loserVehicle = await vehicles.findById(loserVehicleId).lean();
      expect(loserVehicle?.assignedOperatorId).toBeNull();
    });
  });

  describe('releaseOperatorFromVehicle', () => {
    it('clears both sides when the operator is holding the vehicle', async () => {
      const vehicleId = await seedVehicle();
      const operatorId = await seedOperator();
      await service.assignOperatorToVehicle(operatorId, vehicleId);

      const result = await service.releaseOperatorFromVehicle(
        operatorId,
        vehicleId,
      );

      expect(result.assignedOperatorId).toBeNull();
      const op = await operators.findById(operatorId).lean();
      expect(op?.currentVehicleId).toBeNull();
    });

    it('rejects when the operator does not hold the vehicle (VEHICLE_NOT_HELD_BY_OPERATOR)', async () => {
      const vehicleId = await seedVehicle();
      const holderId = await seedOperator();
      const strangerId = await seedOperator();
      await service.assignOperatorToVehicle(holderId, vehicleId);

      await expect(
        service.releaseOperatorFromVehicle(strangerId, vehicleId),
      ).rejects.toBeInstanceOf(VehicleNotHeldByOperatorError);

      const v = await vehicles.findById(vehicleId).lean();
      expect(v?.assignedOperatorId?.toString()).toBe(holderId);
    });
  });
});
