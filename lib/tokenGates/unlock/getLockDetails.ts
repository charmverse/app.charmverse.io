import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { PublicLockV13 } from '@unlock-protocol/contracts';
import { networks } from '@unlock-protocol/networks';
import { unlockChains } from 'connectors/chains';
import { getAddress } from 'viem';

import { getAlchemyBaseUrl } from 'lib/blockchain/provider/alchemy/client';
import { isNumber } from 'lib/utilities/numbers';

import type { Lock } from '../interfaces';

import { getPublicClient } from './client';
import { getLockMetadata } from './getLockMetadata';

type GetLockPayload = {
  chainId: number;
  contract: string;
  walletAddress?: string;
};

const unlockNetworks = Object.values(networks);

const unlockNetworksSetup = unlockChains.reduce<Record<number, { unlockAddress: string; provider: string }>>(
  (acc, chain) => {
    try {
      return {
        ...acc,
        [chain.chainId]: {
          unlockAddress: unlockNetworks.find((n: any): n is any => n.id === chain.chainId)?.unlockAddress || '',
          provider: chain.alchemyUrl ? getAlchemyBaseUrl(chain.chainId) : chain.rpcUrls[0]
        }
      };
    } catch (err) {
      // This is more for the tests to pass
      return {
        ...acc,
        [chain.chainId]: {
          unlockAddress: unlockNetworks.find((n: any): n is any => n.id === chain.chainId)?.unlockAddress || '',
          provider: chain.rpcUrls[0]
        }
      };
    }
  },
  {}
);

export async function getLockDetails(
  values: GetLockPayload,
  withMetadata?: boolean
): Promise<Lock & { validKey?: boolean }> {
  const { chainId: initialChain, contract, walletAddress } = values;

  if (!isNumber(Number(initialChain))) {
    throw new InvalidInputError('Chain must be a number');
  }

  // Validate address and throw an error if it's not
  const address = getAddress(contract);

  const chainId = Number(initialChain);

  try {
    const publicClient = getPublicClient(chainId);

    const name = (await publicClient.readContract({
      address,
      abi: PublicLockV13.abi,
      functionName: 'name'
    })) as string;

    const locksmithData = withMetadata ? await getLockMetadata({ contract, chainId }) : undefined;

    const lockMetadata: Lock = {
      name,
      contract,
      chainId,
      image: locksmithData?.image
    };

    if (walletAddress) {
      const validKey = (await publicClient.readContract({
        address,
        abi: PublicLockV13.abi,
        functionName: 'getHasValidKey',
        args: [walletAddress]
      })) as boolean;

      return {
        ...lockMetadata,
        validKey
      };
    }

    return lockMetadata;
  } catch (error: any) {
    throw new DataNotFoundError('Error fetching lock details. Check the contract address and chain.');
  }
}
