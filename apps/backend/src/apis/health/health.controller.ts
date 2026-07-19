import { Controller, Get } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';

/**
 * Simple liveness endpoint. Returns 200 as long as the HTTP layer is up. Used
 * by the Docker HEALTHCHECK and by upstream load balancers to decide when a
 * pod / container is ready to receive traffic.
 */
@ApiTags('health')
@Controller('health')
export class HealthController {
  @Get()
  @ApiOperation({ summary: 'Liveness probe.' })
  check(): { status: 'ok' } {
    return { status: 'ok' };
  }
}
