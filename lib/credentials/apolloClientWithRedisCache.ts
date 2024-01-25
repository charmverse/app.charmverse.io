import { createHash } from 'crypto';

import type { ApolloQueryResult, QueryOptions } from '@apollo/client';
import { ApolloClient, InMemoryCache } from '@apollo/client';
import { log } from '@charmverse/core/log';
import type { RedisClientType } from 'redis';

import { redisClient } from 'adapters/redis/redisClient';

if (!redisClient?.isOpen) {
  redisClient?.connect().catch((err) => {
    log.error('error', 'Error connecting to Redis', err);
  });
}

/**
 *
 */
export class ApolloClientWithRedisCache extends ApolloClient<any> {
  private persistForSeconds: number;

  private redisClient = redisClient as RedisClientType;

  private cacheKeyPrefix: string;

  /**
   * @cacheKeyPrefix - A prefix to be added to the cache key. Useful when multiple different clients use the same cache and might have similar queries
   */
  constructor(args: { uri: string; persistForSeconds: number; cacheKeyPrefix?: string }) {
    super({
      cache: new InMemoryCache(),
      uri: args.uri
    });
    this.persistForSeconds = args.persistForSeconds;

    this.cacheKeyPrefix = args.cacheKeyPrefix || '';
  }

  createCacheKey(json: object): string {
    const jsonString = JSON.stringify(json);
    return `${this.cacheKeyPrefix}${createHash('md5').update(jsonString).digest('hex')}`;
  }

  /**
   * This method overrides the default query method of ApolloClient
   * If redisClient exists, the query will always be executed, unless a result is found in the Redis cache
   *
   * If no Redis Client is available, the query will be executed as usual
   */
  async query(options: Pick<QueryOptions, 'query' | 'variables'>): Promise<ApolloQueryResult<any>> {
    if (!this.redisClient || !this.redisClient.isReady) {
      return super.query(options);
    }

    // Force bypassing the in-memory cache so that the query always executes
    (options as QueryOptions).fetchPolicy = 'no-cache';

    const cacheKey = this.createCacheKey({ query: options.query, variables: options.variables });

    const existingData = await this.redisClient.get(cacheKey);

    if (existingData) {
      return JSON.parse(existingData);
    }

    const result = await super.query(options);
    this.redisClient.SETEX(cacheKey, this.persistForSeconds, JSON.stringify(result));

    return result;
  }
}
