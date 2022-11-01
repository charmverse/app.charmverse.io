import type { RedisClientType } from 'redis';
import { createClient } from 'redis';

import log from 'lib/log';

// Export the singleton instance
declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var redisClient: RedisClientType;
}

let redisClientInstance: RedisClientType | null = null;

if (process.env.REDIS_URI) {
  try {
    redisClientInstance = global.redisClient ?? createClient({ url: process.env.REDIS_URI });
    redisClientInstance.on('error', (err) => log.debug(`Redis Client Error ${err}`));
  }
  catch (err) {
    log.debug(`Could not instantiate Redis. Error occurred: ${err}`);
  }
}

// remember this instance of prisma in development to avoid too many clients
if (process.env.NODE_ENV === 'development' && redisClientInstance) {
  global.redisClient = redisClientInstance;
}

export const redisClient = redisClientInstance;
