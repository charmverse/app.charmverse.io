import { log } from '@packages/core/log';
import { getPublicClient } from '@packages/lib/blockchain/publicClient';
import { RateLimit } from 'async-sema';
import { getAddress } from 'viem';

import { ProjectRegistryAbi } from './abi/ProjectRegistry';
import { PROJECT_REGISTRY_ADDRESSES } from './constants';

export type ChainId = keyof typeof PROJECT_REGISTRY_ADDRESSES;

export async function getProjectCount() {
  const rateLimiter = RateLimit(1);
  const chains = Object.keys(PROJECT_REGISTRY_ADDRESSES).map(Number) as ChainId[];
  const projects = await chains.reduce<Promise<Record<ChainId, number>>>(
    async (_acc, chainId) => {
      await rateLimiter();
      const acc = await _acc;
      const publicClient = getPublicClient(chainId);

      try {
        const projectsCount = await publicClient.readContract({
          address: getAddress(PROJECT_REGISTRY_ADDRESSES[chainId]),
          abi: ProjectRegistryAbi,
          functionName: 'projectsCount'
        });
        // log.info(`🔥 number of projects for chain id ${chainId}`, Number(projectsCount));
        acc[chainId] = Number(projectsCount);
        return acc;
      } catch (err) {
        log.error(`🔥 error fetching projects for chain id ${chainId}`, err);
        return acc;
      }
    },
    {} as Promise<Record<ChainId, number>>
  );

  return projects;
}
