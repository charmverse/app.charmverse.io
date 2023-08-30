// init app instrumentation
import './websockets/datadog';
import { log } from '@charmverse/core/log';

import { appEnv } from 'config/constants';

import { httpServer, socketServer } from './websockets/app';
import { cleanup as originCacheCleanup } from './websockets/verifyCustomOrigin';

const port = process.env.PORT || 3002;

httpServer.listen(port);

log.info(`[server] Websocket server running in ${appEnv} listening to port: ${port}`);

function cleanup() {
  log.info('[server] Closing Websocket server...');
  originCacheCleanup();
  socketServer.close(() => {
    log.info('[server] Closing HTTP server...');
    httpServer.close(() => {
      log.info('[server] Exiting process...');
      process.exit(1);
    });
  });
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
