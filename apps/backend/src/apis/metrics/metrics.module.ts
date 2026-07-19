import { Module } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { PrometheusModule } from '@willsoto/nestjs-prometheus';
import { HttpMetricsInterceptor } from './http-metrics.interceptor';
import { httpRequestDurationProvider } from './http-metrics.provider';

/**
 * Exposes GET /metrics for Prometheus to scrape. Registers a global HTTP
 * interceptor that records every request into the duration histogram, and
 * enables the prom-client default metrics collector (Node runtime stats:
 * event loop lag, heap, GC pauses, file descriptors, ...).
 */
@Module({
  imports: [
    PrometheusModule.register({
      path: '/metrics',
      defaultMetrics: { enabled: true },
    }),
  ],
  providers: [
    httpRequestDurationProvider,
    { provide: APP_INTERCEPTOR, useClass: HttpMetricsInterceptor },
  ],
})
export class MetricsModule {}
