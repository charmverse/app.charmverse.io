import { createServer } from 'http';

import { Server } from 'socket.io';

import { appEnv } from 'config/constants';
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
      // support any subdomain for staging
      if (requestOrigin?.endsWith('.charmverse.co') || requestOrigin?.endsWith('.charmverse.io')) {
        callback(null, requestOrigin);
      } else {
        callback(new Error('Not allowed by CORS'));
      }
    }
  }
});

relay.bindServer(io);

server.listen(port);

log.info(`Web socket server running in ${appEnv} listening to port: `, port);
