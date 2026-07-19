import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { InjectMetric } from '@willsoto/nestjs-prometheus';
import { Histogram } from 'prom-client';
import { Observable, tap } from 'rxjs';
import { HTTP_REQUEST_DURATION_SECONDS } from './http-metrics.provider';

/**
 * Records wall-clock request duration for every HTTP handler into the
 * http_request_duration_seconds histogram. Route label uses the express
 * route pattern (e.g. /vehicles/:id) so cardinality stays bounded — a raw
 * URL would produce one series per id.
 */
@Injectable()
export class HttpMetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric(HTTP_REQUEST_DURATION_SECONDS)
    private readonly histogram: Histogram<'method' | 'route' | 'status'>,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();

    const req = context.switchToHttp().getRequest<{
      method: string;
      route?: { path?: string };
      url: string;
    }>();
    const res = context.switchToHttp().getResponse<{ statusCode: number }>();

    const start = process.hrtime.bigint();
    const method = req.method;

    const finish = () => {
      const nanos = Number(process.hrtime.bigint() - start);
      const seconds = nanos / 1e9;
      // Fall back to the raw URL only if the route matcher didn't fill in
      // req.route (happens on 404s that don't match any handler).
      const route = req.route?.path ?? req.url;
      this.histogram.observe(
        { method, route, status: String(res.statusCode) },
        seconds,
      );
    };

    return next.handle().pipe(
      tap({
        next: () => finish(),
        error: () => finish(),
      }),
    );
  }
}
