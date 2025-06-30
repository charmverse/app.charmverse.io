import { DataNotFoundError, InvalidInputError } from '@packages/core/errors';
import { log } from '@packages/core/log';
import { isNumber } from '@packages/lib/utils/numbers';
import { getAddress } from 'viem';

import { getPublicClient } from '../../blockchain/publicClient';
import type { AccessControlCondition } from '../interfaces';

import { subscriptionTokenV1ABI } from './abi';

type GetHypersubPayload = Pick<AccessControlCondition, 'chain' | 'contractAddress'> & {
  walletAddress?: string;
};

export async function getHypersubDetails(props: GetHypersubPayload) {
  const { chain, contractAddress, walletAddress } = props;

  if (!isNumber(Number(chain))) {
    throw new InvalidInputError('Chain must be a number');
  }

  // Validate address and throw an error if it's not valid
  const address = getAddress(contractAddress);
  const chainId = Number(chain);

  try {
    const publicClient = getPublicClient(chainId);

    const name = await publicClient.readContract({
      address,
      abi: subscriptionTokenV1ABI,
      functionName: 'name'
    });

    const hypersubMetadata = {
      ...props,
      name,
      image: '/images/logos/fabric-xyz.svg'
    };

    return hypersubMetadata;
  } catch (error: any) {
    log.error('Error fetching hypersub details. Check the contract address and chain', { error });
    throw new DataNotFoundError('Error fetching hypersub details. Check the contract address and chain.');
  }
}

export async function validateHypersubCondition<T extends Required<GetHypersubPayload>>(
  props: T
): Promise<T & { validKey?: boolean }> {
  const { chain, contractAddress, walletAddress: initialWalletAddress } = props;
  const publicClient = getPublicClient(chain);
  const address = getAddress(contractAddress);
  const walletAddress = getAddress(initialWalletAddress);

  const balanceOf = await publicClient.readContract({
    address,
    abi: subscriptionTokenV1ABI,
    functionName: 'balanceOf',
    args: [walletAddress]
  });

  return balanceOf > 0 ? { ...props, validKey: true } : props;
}
