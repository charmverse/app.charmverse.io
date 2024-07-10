import { log } from '@charmverse/core/log';

import { app } from './server';

const port = process.env.CONNECT_API_PORT || process.env.PORT || 4000;
const host = '0.0.0.0';

const server = app.listen(typeof port === 'string' ? parseInt(port) : port, host, () => {
  log.info(`🚀 Connect API up on http://localhost:${port}`);
});

// Extending the timeouts addresses 502 errors on AWS Load balancer
server.keepAliveTimeout = 61 * 1000; // load balancer has a 60s timeout
server.headersTimeout = 65 * 1000; // This should be bigger than `keepAliveTimeout + your server's expected response time`

function gracefulShutdown() {
  log.info('Received shutdown instruction. Closing down server');
  // We use server.close to finish processing existing requests
  server.close(() => {
    log.info('Server shutdown completed');
    process.exit(0);
  });
}

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

process.on('uncaughtException', (err) => {
  log.error(`Uncaught Exception: ${err.message}`, err);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error('Unhandled rejection at: ', promise, `reason: ${reason}`);
  process.exit(1);
});
