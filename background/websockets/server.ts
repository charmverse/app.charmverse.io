import { createServer } from 'http';

import { log } from '@charmverse/core/log';
import { Server } from 'socket.io';

import { isDevEnv } from 'config/constants';
import { verifyCustomOrigin } from 'lib/middleware/verifyCustomOrigin';
import { config } from 'lib/websockets/config';
import { relay } from 'lib/websockets/relay';

import app from '../healthCheck/app';

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

relay.bindServer(io);

export { server, io };
