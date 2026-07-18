import { Logger } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';
import {
  OnGatewayConnection,
  OnGatewayDisconnect,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { randomUUID } from 'node:crypto';
import { Server, Socket } from 'socket.io';
import { VehicleChangeStreamWatcher } from '../../data-access/vehicles/vehicle-change-stream.watcher';
import { VEHICLE_CHANGED_EVENT } from '../../domain/vehicles/vehicle.events';
import type { VehicleChangedEvent } from '../../domain/vehicles/vehicle.events';
import { VehicleRepository } from '../../domain/vehicles/vehicle.repository';

/**
 * WebSocket endpoint that streams vehicle state changes to connected clients.
 *
 * Lifecycle:
 * - First client connect  → starts the Mongo change stream watcher.
 * - Last client disconnect → stops the watcher (no wasted cursor when idle).
 * - Every client, on connect, receives a full snapshot as `vehicles.snapshot`.
 * - Every `vehicle.changed` domain event is broadcast to that instance's
 *   connected clients.
 *
 * Namespace `/realtime`. Clients connect via
 *   io('http://localhost:3000/realtime')
 */
@WebSocketGateway({
  namespace: '/realtime',
  cors: { origin: true, credentials: true },
  pingInterval: 10000,
  pingTimeout: 5000,
})
export class VehiclesGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  private readonly logger = new Logger(VehiclesGateway.name);
  private readonly instanceId =
    process.env.HOSTNAME ?? randomUUID().slice(0, 8);
  private connectedCount = 0;

  @WebSocketServer()
  server!: Server;

  constructor(
    private readonly watcher: VehicleChangeStreamWatcher,
    private readonly vehicles: VehicleRepository,
  ) {}

  async handleConnection(client: Socket): Promise<void> {
    this.connectedCount++;
    if (this.connectedCount === 1) {
      this.watcher.start();
    }

    const vehicles = await this.vehicles.findAll();
    client.emit('vehicles.snapshot', {
      vehicles,
      instanceId: this.instanceId,
    });

    this.logger.log(
      `Client ${client.id} connected to instance ${this.instanceId} (${this.connectedCount} total)`,
    );
  }

  async handleDisconnect(client: Socket): Promise<void> {
    this.connectedCount = Math.max(0, this.connectedCount - 1);
    if (this.connectedCount === 0) {
      await this.watcher.stop();
    }
    this.logger.log(
      `Client ${client.id} disconnected from instance ${this.instanceId} (${this.connectedCount} total)`,
    );
  }

  @OnEvent(VEHICLE_CHANGED_EVENT)
  onVehicleChanged(event: VehicleChangedEvent): void {
    this.server.emit('vehicle.changed', event);
  }
}
