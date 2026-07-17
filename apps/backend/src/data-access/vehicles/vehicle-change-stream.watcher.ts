import {
  Injectable,
  Logger,
  OnApplicationShutdown,
} from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { InjectModel } from '@nestjs/mongoose';
import { ChangeStream, ChangeStreamDocument } from 'mongodb';
import { Model } from 'mongoose';
import {
  VEHICLE_CHANGED_EVENT,
  VehicleChangedEvent,
} from '../../domain/vehicles/vehicle.events';
import { toVehicle } from './vehicles.mapper';
import { VehicleDocument, VehicleModel } from './vehicles.schema';

/**
 * Watches the vehicles collection via a MongoDB change stream and translates
 * every write into a domain-level `vehicle.changed` event on the app-wide
 * EventEmitter2.
 *
 * Lifecycle is caller-driven: nothing happens until `start()` is invoked
 * (e.g. by the WebSocket gateway on the first subscriber, or by an admin
 * endpoint). `stop()` and the OnApplicationShutdown hook both guarantee the
 * underlying Mongo cursor is closed even if the caller forgets.
 *
 * Uses `fullDocument: 'updateLookup'` so update events include the current
 * document state — subscribers can treat every event as "here is the latest
 * snapshot".
 */
@Injectable()
export class VehicleChangeStreamWatcher implements OnApplicationShutdown {
  private readonly logger = new Logger(VehicleChangeStreamWatcher.name);
  private stream: ChangeStream | null = null;

  constructor(
    @InjectModel(VehicleModel.name)
    private readonly model: Model<VehicleModel>,
    private readonly emitter: EventEmitter2,
  ) {}

  /**
   * Open the change stream. Idempotent — calling `start()` while already
   * watching is a no-op.
   */
  start(): void {
    if (this.stream) return;

    this.stream = this.model.watch(
      [
        {
          $match: {
            operationType: { $in: ['insert', 'update', 'replace', 'delete'] },
          },
        },
      ],
      { fullDocument: 'updateLookup' },
    );

    this.stream.on('change', (change) => this.handleChange(change));
    this.stream.on('error', (err) => {
      this.logger.error('Vehicle change stream error', err as Error);
    });

    this.logger.log('Watching vehicles collection for changes');
  }

  /**
   * Close the change stream. Idempotent.
   */
  async stop(): Promise<void> {
    if (!this.stream) return;
    await this.stream.close();
    this.stream = null;
    this.logger.log('Stopped watching vehicles collection');
  }

  /** True while the change stream is open. */
  isWatching(): boolean {
    return this.stream !== null;
  }

  onApplicationShutdown(): Promise<void> {
    return this.stop();
  }

  private handleChange(change: ChangeStreamDocument): void {
    if (change.operationType === 'delete') {
      const event: VehicleChangedEvent = {
        kind: 'deleted',
        vehicleId: change.documentKey._id.toString(),
        vehicle: null,
      };
      this.emitter.emit(VEHICLE_CHANGED_EVENT, event);
      return;
    }

    if (
      change.operationType === 'insert' ||
      change.operationType === 'update' ||
      change.operationType === 'replace'
    ) {
      const doc = change.fullDocument as VehicleDocument | undefined;
      if (!doc) return; // document was deleted between the event and the lookup
      const event: VehicleChangedEvent = {
        kind: change.operationType === 'insert' ? 'created' : 'updated',
        vehicleId: doc._id.toString(),
        vehicle: toVehicle(doc),
      };
      this.emitter.emit(VEHICLE_CHANGED_EVENT, event);
    }
  }
}
