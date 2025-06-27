import { createHash } from 'crypto';

import type { ApolloQueryResult, QueryOptions } from '@apollo/client';
import { ApolloClient, ApolloLink, HttpLink, InMemoryCache } from '@apollo/client';
import { redisClient } from '@packages/adapters/redis/redisClient';
import { log } from '@packages/core/log';
import type { RedisClientType } from 'redis';

/**
 *
 */
export class ApolloClientWithRedisCache extends ApolloClient<any> {
  private persistForSeconds: number;

  private redisClient = redisClient as RedisClientType;

  private cacheKeyPrefix: string;

  private skipRedisCache: boolean;

  /**
   * @cacheKeyPrefix - A prefix to be added to the cache key. Useful when multiple different clients use the same cache and might have similar queries
   */
  constructor(args: {
    uri: string;
    persistForSeconds: number;
    cacheKeyPrefix?: string;
    skipRedisCache?: boolean;
    authHeader?: string;
  }) {
    const httpLink = new HttpLink({ uri: args.uri });

    let link = httpLink;

    if (args.authHeader) {
      const authLink = new ApolloLink((operation, forward) => {
        operation.setContext({
          headers: {
            authorization: args.authHeader
          }
        });
        return forward(operation);
      });

      link = ApolloLink.from([authLink, httpLink]) as HttpLink;
    }

    super({
      cache: new InMemoryCache(),
      link
    });

    this.persistForSeconds = args.persistForSeconds;
    this.cacheKeyPrefix = args.cacheKeyPrefix || '';
    this.skipRedisCache = !!args.skipRedisCache;
  }

  createCacheKey(json: object): string {
    const jsonString = JSON.stringify(json);
    return `${this.cacheKeyPrefix}${createHash('md5').update(jsonString).digest('hex')}`;
  }

  async getFromCache(cacheKey: string): Promise<ApolloQueryResult<any> | null> {
    try {
      const data = await this.redisClient.get(cacheKey);
      if (data) {
        return JSON.parse(data);
      }
      return null;
    } catch {
      log.error('Error reading redis cache');
      return null;
    }
  }

  setCache(cacheKey: string, data: ApolloQueryResult<any>): void {
    try {
      this.redisClient.set(cacheKey, JSON.stringify(data), {
        EX: this.persistForSeconds
      });
    } catch (error) {
      log.error('Error setting redis cache', error);
    }
  }

  /**
   * This method overrides the default query method of ApolloClient
   * If redisClient exists, the query will always be executed, unless a result is found in the Redis cache
   *
   * If no Redis Client is available, the query will be executed as usual
   */
  async query<T = any>(options: Pick<QueryOptions, 'query' | 'variables'>): Promise<ApolloQueryResult<T>> {
    // Force bypassing the in-memory cache so that the query always executes
    (options as QueryOptions).fetchPolicy = 'no-cache';

    if (this.skipRedisCache || !this.redisClient || !this.redisClient.isOpen || !this.redisClient.isReady) {
      return super.query(options);
    }

    const cacheKey = this.createCacheKey({ query: options.query, variables: options.variables });

    const data = await this.getFromCache(cacheKey);

    if (data) {
      return data;
    }

    const refreshedData = await super.query(options);

    this.setCache(cacheKey, refreshedData);

    return refreshedData;
  }
}
