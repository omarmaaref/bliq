import { makeHistogramProvider } from '@willsoto/nestjs-prometheus';

/**
 * Duration histogram for every HTTP request. Labeled by method, route
 * template (not raw URL — avoids exploding label cardinality), and status.
 * Consumers query it as:
 *
 *   histogram_quantile(0.95,
 *     sum by (le, route)
 *       (rate(http_request_duration_seconds_bucket[5m])))
 */
export const HTTP_REQUEST_DURATION_SECONDS = 'http_request_duration_seconds';

export const httpRequestDurationProvider = makeHistogramProvider({
  name: HTTP_REQUEST_DURATION_SECONDS,
  help: 'HTTP request duration in seconds',
  labelNames: ['method', 'route', 'status'],
  buckets: [0.005, 0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5, 10],
});
