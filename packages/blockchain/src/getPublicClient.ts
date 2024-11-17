import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { createPublicClient, http } from 'viem';
import { optimism } from 'viem/chains';

import { getChainById } from './chains';
import { getAlchemyBaseUrl } from './getAlchemyBaseUrl';

/**
 * Create a viem public client for a given chain.
 * It uses alchemy rpcs if available, otherwise it will use the first rpc url found.
 * The best use case for this is reading a contract details using a custom ABI from the protocols we use.
 *
 * @param chainId number
 * @returns the public client
 * @throws InvalidInputError if the chain is not supported
 */
export const getPublicClient = (chainId: number) => {
  const chainDetails = getChainById(chainId);

  if (!chainDetails) {
    throw new InvalidInputError(`Chain id ${chainId} not supported`);
  }

  let providerUrl: string | null = chainDetails.rpcUrls[0];

  const chain = chainDetails.viem;

  if (chainDetails.alchemyUrl) {
    try {
      const alchemyProviderUrl = getAlchemyBaseUrl(chainId);
      providerUrl = alchemyProviderUrl;
    } catch (error) {
      log.error('Error getting alchemy provider url', { error, chainId });
    }
  }

  return createPublicClient({
    chain,
    transport: http(providerUrl, {
      retryCount: 1,
      timeout: 5000
    })
  });
};
