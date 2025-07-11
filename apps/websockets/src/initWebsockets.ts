import { appEnv } from '@packages/config/constants';
import { log } from '@packages/core/log';

import { httpServer, socketServer } from './app/server';
import { cleanup as originCacheCleanup } from './app/verifyCustomOrigin';

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
      process.exit(0);
    });
  });
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
