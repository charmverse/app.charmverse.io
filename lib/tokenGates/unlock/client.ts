import { InvalidInputError } from '@charmverse/core/errors';
import { getChainById } from 'connectors/chains';
import { createPublicClient, http } from 'viem';

import { getAlchemyBaseUrl } from 'lib/blockchain/provider/alchemy/client';

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
