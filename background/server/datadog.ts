import tracer from 'dd-trace';

if (process.env.NODE_ENV === 'production') {
  tracer.init({
    logInjection: true,
    runtimeMetrics: true
  });
  tracer.use('koa', {
    blocklist: ['/api/health_check']
  });
}
