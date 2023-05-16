import { createServer } from 'http';

import { log } from '@charmverse/core/log';
import { Server } from 'socket.io';

import { appEnv, isDevEnv } from 'config/constants';
import { relay } from 'lib/websockets/relay';

import app from './server/app';

const port = process.env.PORT || 3001;

const server = createServer(app.callback());

const io = new Server(server, {
  cors: {
    allowedHeaders: ['authorization'],
    credentials: true,
    origin: (requestOrigin, callback) => {
      // support any subdomain for staging
      if (requestOrigin?.endsWith('.charmverse.co') || requestOrigin?.endsWith('.charmverse.io')) {
        callback(null, requestOrigin);
      } else if (isDevEnv) {
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
  log.info('[server] Closing Websocket server connections...');
  server.close(() => {
    log.info('[server] Exiting process...');
    process.exit(1);
  });
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
