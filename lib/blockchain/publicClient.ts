import { InvalidInputError } from '@charmverse/core/errors';
import { getChainById } from 'connectors/chains';
import { createPublicClient, http } from 'viem';

import { getAlchemyBaseUrl } from 'lib/blockchain/provider/alchemy/client';

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
    throw new InvalidInputError('Chain not supported');
  }

  const provider = chainDetails.alchemyUrl ? getAlchemyBaseUrl(chainDetails.chainId) : chainDetails.rpcUrls[0];
  const chain = chainDetails.viem;

  return createPublicClient({
    chain,
    transport: http(provider)
  });
};
