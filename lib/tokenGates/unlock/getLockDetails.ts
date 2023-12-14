import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { networks } from '@unlock-protocol/networks';
import { Web3Service } from '@unlock-protocol/unlock-js';
import { unlockChains } from 'connectors/chains';

import { getAlchemyBaseUrl } from 'lib/blockchain/provider/alchemy/client';
import { isNumber } from 'lib/utilities/numbers';

import type { Lock } from '../interfaces';

import { getLockMetadata } from './getLockMetadata';

export type GetLockPayload = {
  chainId: number;
  contract: string;
  walletAddress?: string;
};

const unlockNetworks = Object.values(networks);

const unlockNetworksSetup = unlockChains.reduce<Record<number, { unlockAddress: string; provider: string }>>(
  (acc, chain) => {
    return {
      ...acc,
      [chain.chainId]: {
        unlockAddress: unlockNetworks.find((n: any): n is any => n.id === chain.chainId)?.unlockAddress || '',
        provider: chain.alchemyUrl ? getAlchemyBaseUrl(chain.chainId) : chain.rpcUrls[0]
      }
    };
  },
  {}
);

export function getUnlockService() {
  const web3Service = new Web3Service(unlockNetworksSetup);
  return web3Service;
}

export async function getLockDetails(values: GetLockPayload, withMetadata?: boolean): Promise<Lock> {
  const { chainId: initialChain, contract, walletAddress } = values;

  if (!isNumber(Number(initialChain))) {
    throw new InvalidInputError('Chain must be a number');
  }

  const chainId = Number(initialChain);

  try {
    const web3Service = getUnlockService();
    const lock = await web3Service.getLock(contract, chainId);
    const locksmithData = withMetadata ? await getLockMetadata({ contract, chainId }) : undefined;

    const lockMetadata: Lock = {
      name: lock?.name,
      contract,
      chainId,
      image: locksmithData?.image,
      description: locksmithData?.description
    };

    if (walletAddress) {
      const balanceOf = await web3Service.balanceOf(contract, walletAddress, chainId);
      const expirationTimestamp = await web3Service.getKeyExpirationByLockForOwner(contract, walletAddress, chainId);

      return {
        ...lockMetadata,
        balanceOf,
        expirationTimestamp: expirationTimestamp * 1000
      };
    }

    return lockMetadata;
  } catch (error: any) {
    throw new DataNotFoundError('Error fetching lock details. Check the contract address and chain.');
  }
}
