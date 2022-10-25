import type { RedisClientType } from 'redis';
import { createClient } from 'redis';

import log from 'lib/log';

// Export the singleton instance
declare global {
  // eslint-disable-next-line no-var, vars-on-top
  var redisClient: RedisClientType;
}

export const redisClient = global.redisClient ?? createClient({ url: process.env.REDIS_URI });

redisClient.on('error', (err) => log.debug(`Redis Client Error ${err}`));

// remember this instance of prisma in development to avoid too many clients
if (process.env.NODE_ENV === 'development') {
  global.redisClient = redisClient;
}
