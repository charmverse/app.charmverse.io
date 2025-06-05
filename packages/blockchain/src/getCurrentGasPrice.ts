import { redisClient } from '@packages/adapters/redis/redisClient';

import { getPublicClient } from './getPublicClient';

/**
 * Get the current gas price for a given chain, with at most 60 seconds of cache.
 */
export async function getCurrentGasPrice({ chainId }: { chainId: number }): Promise<bigint> {
  const cacheKey = `gasPrice:${chainId}`;

  const cachedGasPrice = await redisClient?.get(`gasPrice:${chainId}`).catch(() => null);

  if (cachedGasPrice) {
    return BigInt(cachedGasPrice);
  }

  const gasPrice = await getPublicClient(chainId).getGasPrice();

  await redisClient?.set(cacheKey, gasPrice.toString(), { EX: 60 }).catch(() => null);

  return gasPrice;
}
