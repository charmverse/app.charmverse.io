// init app instrumentation
import './server/datadog';

import { createServer } from 'http';

import { log } from '@charmverse/core/log';
import { Server } from 'socket.io';

import { appEnv, isDevEnv } from 'config/constants';
import { allowedOriginsCache } from 'lib/middleware/allowedOriginsCache';
import { config } from 'lib/websockets/config';
import { relay } from 'lib/websockets/relay';

import app from './server/app';

const port = process.env.PORT || 3002;

const server = createServer(app.callback());

const io = new Server(server, {
  ...config,
  cors: {
    allowedHeaders: ['authorization'],
    credentials: true,
    origin: (requestOrigin, callback) => {
      if (isDevEnv) {
        callback(null, requestOrigin);
      } else if (!allowedOriginsCache.allowedOrigins) {
        // custom origins did not load yet, allow all origins temporarily
        callback(null, '*');
      } else if (allowedOriginsCache.allowedOrigins.some((origin) => requestOrigin?.endsWith(origin))) {
        callback(null, requestOrigin);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  }
});

relay.bindServer(io);

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
