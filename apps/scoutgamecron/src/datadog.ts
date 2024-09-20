import tracer from 'dd-trace';

if (process.env.NODE_ENV === 'production') {
  tracer.init({
    logInjection: true,
    runtimeMetrics: true,
    service: process.env.SERVICE_NAME
  });
  tracer.use('koa', {
    blocklist: ['/api/health']
  });
}
