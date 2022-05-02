
import { tracer as Tracer } from 'dd-trace';

Tracer.init({
  // Your options here.
  runtimeMetrics: true,
  env: process.env.NODE_ENV,
  logInjection: true
});

console.log('[datadog] init env: ', process.env.NODE_ENV);
