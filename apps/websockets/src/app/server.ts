import { createServer } from 'http';

import { log } from '@charmverse/core/log';
import { isDevEnv, isTestEnv } from '@packages/config/constants';
import { Server } from 'socket.io';

import { config } from 'lib/websockets/config';
import { relay } from 'lib/websockets/relay';

import app from '../healthCheck/app';

import { verifyCustomOrigin } from './verifyCustomOrigin';

const httpServer = createServer(app.callback());

const socketServer: Server = new Server(httpServer, {
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
