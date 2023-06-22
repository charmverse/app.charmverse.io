// init app instrumentation
import './server/datadog';

import { createServer } from 'http';

import { log } from '@charmverse/core/log';
import { Server } from 'socket.io';

import { appEnv, isDevEnv } from 'config/constants';
import { verifyCustomOrigin } from 'lib/middleware/verifyCustomOrigin';
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
    origin: async (requestOrigin, callback) => {
      // support any subdomain for staging
      if (
        requestOrigin?.endsWith('.charmverse.co') ||
        requestOrigin?.endsWith('.charmverse.io') ||
        requestOrigin?.endsWith('.0xepicode.com') // TEMP for demo
      ) {
        callback(null, requestOrigin);
      } else if (isDevEnv) {
        callback(null, requestOrigin);
      } else {
        const isCustomOriginAllowed = await verifyCustomOrigin(requestOrigin);
        if (!isCustomOriginAllowed) {
          log.warn('Not allowed by CORS');

          callback(new Error('Not allowed by CORS'));
        } else {
          callback(null, requestOrigin);
        }
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
