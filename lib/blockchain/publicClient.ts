import { InvalidInputError } from '@charmverse/core/errors';
import { getChainById } from 'connectors/chains';
import { createPublicClient, http } from 'viem';

import { getAlchemyBaseUrl } from 'lib/blockchain/provider/alchemy/client';

import { getAnkrBaseUrl } from './provider/ankr/client';
import { isAnkrChain } from './provider/ankr/config';

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

  let providerUrl: string | null = null;

  try {
    providerUrl = chainDetails.alchemyUrl
      ? getAlchemyBaseUrl(chainDetails.chainId)
      : isAnkrChain(chainId)
      ? getAnkrBaseUrl(chainId)
      : chainDetails.rpcUrls[0];
  } catch (err) {
    if (!providerUrl && !chainDetails.rpcUrls.length) {
      throw new InvalidInputError('No RPC url available for the chain');
    } else {
      providerUrl = chainDetails.rpcUrls[0];
    }
  }

  const chain = chainDetails.viem;

  return createPublicClient({
    chain,
    transport: http(providerUrl)
  });
};
