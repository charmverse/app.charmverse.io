import { DataNotFoundError, InvalidInputError } from '@packages/core/errors';
import { log } from '@packages/core/log';
import { PublicLockV13 } from '@packages/lib/tokenGates/unlock/abi';
import { isNumber } from '@packages/lib/utils/numbers';
import { getAddress } from 'viem';

import { getPublicClient } from '../../blockchain/publicClient';
import type { AccessControlCondition } from '../interfaces';

import { getLockMetadata } from './getLockMetadata';

type GetLockPayload = Pick<AccessControlCondition, 'chain' | 'contractAddress'> & {
  walletAddress?: string;
};

export async function getLockDetails(
  values: GetLockPayload,
  withMetadata?: boolean
): Promise<GetLockPayload & { validKey?: boolean }> {
  const { chain, contractAddress, walletAddress } = values;

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
      abi: PublicLockV13,
      functionName: 'name'
    });

    const locksmithData = withMetadata ? await getLockMetadata({ contract: contractAddress, chainId }) : undefined;

    const lockMetadata = {
      contractAddress,
      chain,
      name,
      image: locksmithData?.image
    };

    if (walletAddress) {
      const hasValidKey = await validateLock({ contractAddress, chain, walletAddress });

      return {
        ...lockMetadata,
        validKey: hasValidKey
      };
    }

    return lockMetadata;
  } catch (error: any) {
    log.error('Error fetching Unlock details', { error });
    throw new DataNotFoundError('Error fetching lock details. Check the contract address and chain.');
  }
}

export async function validateLock({
  contractAddress,
  chain,
  walletAddress
}: Pick<AccessControlCondition, 'chain' | 'contractAddress'> & { walletAddress: string }) {
  const publicClient = getPublicClient(chain);
  const address = getAddress(contractAddress);
  const wallet = getAddress(walletAddress);

  const hasValidKey = await publicClient.readContract({
    address,
    abi: PublicLockV13,
    functionName: 'getHasValidKey',
    args: [wallet]
  });

  return hasValidKey;
}
