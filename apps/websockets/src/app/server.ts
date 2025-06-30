import { createServer } from 'http';

import { isDevEnv, isTestEnv } from '@packages/config/constants';
import { log } from '@packages/core/log';
import { relay } from '@packages/websockets/relay';
import { Server } from 'socket.io';

import app from '../healthCheck/app';

import { verifyCustomOrigin } from './verifyCustomOrigin';

const httpServer = createServer(app.callback());

const socketServer: Server = new Server(httpServer, {
  // increase the amount of data that can be sent to the server
  maxHttpBufferSize: 1e7, // set from 1e6 (1MB) to 1e7 (10Mb)
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
      } else if (isDevEnv || isTestEnv) {
        callback(null, requestOrigin);
      } else {
        let isCustomOriginAllowed = false;

        try {
          isCustomOriginAllowed = await verifyCustomOrigin(requestOrigin);
        } catch (error) {
          log.error('Error verifying custom cors origin', { error, requestOrigin });
        }

        if (!isCustomOriginAllowed) {
          log.warn('Not allowed by CORS', { requestOrigin });

          callback(new Error('Not allowed by CORS'));
        } else {
          callback(null, requestOrigin);
        }
      }
    }
  }
});

relay.bindServer(socketServer);

export { httpServer, socketServer };
