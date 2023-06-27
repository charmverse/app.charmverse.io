// init app instrumentation
import './websockets/datadog';
import { log } from '@charmverse/core/log';

import { appEnv } from 'config/constants';

import { server, io } from './websockets/server';

const port = process.env.PORT || 3002;

server.listen(port);

log.info(`[server] Websocket server running in ${appEnv} listening to port: ${port}`);

function cleanup() {
  log.info('[server] Closing Websocket server...');
  io.close();
  server.close(() => {
    log.info('[server] Exiting process...');
    process.exit(1);
  });
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
