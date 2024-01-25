import { log } from '@charmverse/core/log';
import type { RedisClientType } from 'redis';
import { createClient } from 'redis';

import { isDevEnv } from 'config/constants';

let redisClientInstance: RedisClientType | null = null;

const redisUri = process.env.REDIS_URI;

if (redisUri) {
  try {
    redisClientInstance =
      ((global as any).redisClient as RedisClientType) ??
      createClient({
        url: redisUri,
        socket: isDevEnv
          ? {
              // Avoid infinite errors on local dev
              reconnectStrategy: () => 1800000
            }
          : undefined
      });
    redisClientInstance.on('error', (error) => log.error('Redis error occurred', error));
  } catch (error) {
    log.error('Could not instantiate Redis. Error occurred', error);
  }
}

// remember this instance of prisma in development to avoid too many clients
if (process.env.NODE_ENV === 'development' && redisClientInstance) {
  (global as any).redisClient = redisClientInstance;
}

export const redisClient = redisClientInstance;
