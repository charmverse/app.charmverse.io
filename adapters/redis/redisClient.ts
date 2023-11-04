import { log } from '@charmverse/core/log';
import type { RedisClientType } from 'redis';
import { createClient } from 'redis';

let redisClientInstance: RedisClientType | null = null;

if (process.env.REDIS_URI) {
  try {
    redisClientInstance =
      ((global as any).redisClient as RedisClientType) ?? createClient({ url: process.env.REDIS_URI });
    redisClientInstance.on('error', (error) => log.error('Redis Client Error', error));
  } catch (error) {
    log.error('Could not instantiate Redis. Error occurred', error);
  }
}

// remember this instance of prisma in development to avoid too many clients
if (process.env.NODE_ENV === 'development' && redisClientInstance) {
  (global as any).redisClient = redisClientInstance;
}

export const redisClient = redisClientInstance;
