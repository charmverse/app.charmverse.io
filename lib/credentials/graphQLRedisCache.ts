import { log } from '@charmverse/core/log';
import type { PersistentStorage } from 'apollo3-cache-persist';
import type { RedisClientType } from 'redis';

import { redisClient } from 'adapters/redis/redisClient';

export class GraphQlRedisStorage implements PersistentStorage<string | null> {
  defaultTTL: number;

  redisClient = redisClient as RedisClientType;

  constructor({ persistForSeconds }: { persistForSeconds: number }) {
    this.defaultTTL = persistForSeconds;

    if (!redisClient) {
      log.error('Redis client not initialized');
    }
  }

  async getItem(key: string) {
    const cachedData = await this.redisClient.get(key);
    return cachedData ? JSON.parse(cachedData) : null;
  }

  async removeItem(key: string): Promise<void> {
    await this.redisClient.del(key);
  }

  setItem(key: string, value: any): void {
    this.redisClient.set(key, JSON.stringify(value), {
      EX: this.defaultTTL
    });
  }
}
