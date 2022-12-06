import { createServer } from 'http';

import { Server } from 'socket.io';

import { baseUrl, appEnv } from 'config/constants';
import log from 'lib/log';
import { relay } from 'lib/websockets/relay';

import app from './server/app';

const port = process.env.PORT || 3001;

const server = createServer(app.callback());

const io = new Server(server, {
  cors: {
    allowedHeaders: ['authorization'],
    credentials: true,
    origin: (requestOrigin, callback) => {
      if (baseUrl) {
        callback(null, baseUrl);
      }
      // support any subdomain for staging
      else if (requestOrigin?.endsWith('.charmverse.co')) {
        callback(null, requestOrigin);
      }
    }
  }
});

relay.bindServer(io);

server.listen(port);

log.info(`Web socket server running in ${appEnv} listening to port: `, port);
