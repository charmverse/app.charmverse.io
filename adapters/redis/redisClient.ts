import type { RedisClientType } from 'redis';
import { createClient } from 'redis';

import log from 'lib/log';

// Export the singleton instance
declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var redisClient: RedisClientType | null;
}

export function getRedisClient () {

  let redisClient: RedisClientType | null = null;

  if (!global.redisClient && process.env.REDIS_URL) {
    try {
      redisClient = createClient({ url: process.env.REDIS_URI });
      redisClient.on('error', (err) => log.debug(`Redis Client Error ${err}`));
    }
    catch (error) {
      log.error('Redis client failed to connect', error);
    }
  }

  // remember this instance of prisma in development to avoid too many clients
  if (process.env.NODE_ENV === 'development') {
    global.redisClient = redisClient;
  }

  return redisClient;
}
