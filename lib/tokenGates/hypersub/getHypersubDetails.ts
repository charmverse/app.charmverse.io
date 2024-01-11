import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { getAddress } from 'viem';

import { isNumber } from 'lib/utilities/numbers';

import { getPublicClient } from '../../blockchain/publicClient';
import type { Hypersub } from '../interfaces';

import { subscriptionTokenV1ABI } from './abi';

type GetHypersubPayload = {
  chainId: number;
  contract: string;
  walletAddress?: string;
};

export async function getHypersubDetails(values: GetHypersubPayload): Promise<Hypersub & { validKey?: boolean }> {
  const { chainId: initialChain, contract, walletAddress: initialWalletAddress } = values;

  if (!isNumber(Number(initialChain))) {
    throw new InvalidInputError('Chain must be a number');
  }

  // Validate address and throw an error if it's not
  const address = getAddress(contract);
  const chainId = Number(initialChain);

  try {
    const publicClient = getPublicClient(chainId);

    const name = await publicClient.readContract({
      address,
      abi: subscriptionTokenV1ABI,
      functionName: 'name'
    });

    const hypersubMetadata: Hypersub = {
      name,
      contract,
      chainId,
      image: '/images/logos/fabric-xyz.svg'
    };

    if (initialWalletAddress) {
      const walletAddress = getAddress(initialWalletAddress);
      const balanceOf = await publicClient.readContract({
        address,
        abi: subscriptionTokenV1ABI,
        functionName: 'balanceOf',
        args: [walletAddress]
      });

      return {
        ...hypersubMetadata,
        validKey: balanceOf > 0
      };
    }

    return hypersubMetadata;
  } catch (error: any) {
    throw new DataNotFoundError('Error fetching hypersub details. Check the contract address and chain.');
  }
}
