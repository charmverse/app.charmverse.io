import { InvalidInputError } from '@charmverse/core/errors';
import { getChainById } from 'connectors/chains';
import { createPublicClient, http } from 'viem';

export const getPublicClient = (chainId: number) => {
  const chainDetails = getChainById(chainId);
  const chain = chainDetails?.viem;

  if (!chain) {
    throw new InvalidInputError('Chain not supported');
  }

  return createPublicClient({
    chain,
    transport: http()
  });
};
