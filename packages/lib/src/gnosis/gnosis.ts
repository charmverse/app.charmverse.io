import { getChainById, getChainList } from '@packages/blockchain/connectors/chains';
import { getSafeApiClient } from '@packages/blockchain/getSafeApiClient';
import { log } from '@packages/core/log';
import type { SafeInfoResponse, SafeMultisigTransactionListResponse } from '@safe-global/api-kit';
import { RateLimit } from 'async-sema';
import uniqBy from 'lodash/uniqBy';
import { getAddress } from 'viem';
import { mantle, mantleTestnet } from 'viem/chains';

import { getMantleSafeData, getMantleSafesByOwner } from './mantleClient';
import { isSupportedSafeApiChain } from './safe/isSupportedSafeApiChain';

export type GnosisTransaction = SafeMultisigTransactionListResponse['results'][number];

function getGnosisRPCUrl(chainId: number) {
  return getChainById(chainId)?.gnosisUrl;
}

interface GetSafesForAddressProps {
  address: string;
  chainId: number;
}

export type SafeData = { chainId: number } & Omit<SafeInfoResponse, 'masterCopy' | 'guard' | 'singleton'>;

export async function getSafesForAddress({ chainId, address }: GetSafesForAddressProps): Promise<SafeData[]> {
  const checksumAddress = getAddress(address); // convert to checksum address
  if (chainId === mantle.id || chainId === mantleTestnet.id) {
    const serviceUrl = getGnosisRPCUrl(chainId);

    if (!serviceUrl) {
      log.error(`Gnosis RPC URL not found for chainId ${chainId}`);
      return [];
    }

    const { safes = [] } = await getMantleSafesByOwner({
      serviceUrl: getChainById(chainId)?.gnosisUrl as string,
      chainId,
      address: checksumAddress
    }).catch((error) => {
      log.error(`Error getting gnosis safes for address ${address} on Mantle chain ${chainId}`, { error });
      return { safes: [] };
    });

    return Promise.all(
      safes.map(async (safeAddr) => {
        const safeData = await getMantleSafeData({ serviceUrl, chainId, address: getAddress(safeAddr) });
        return {
          chainId,
          address: safeAddr,
          nonce: safeData.nonce.toString(),
          threshold: safeData.threshold,
          masterCopy: safeData.implementation.value,
          owners: safeData.owners.map((owner) => owner.value),
          modules: safeData.modules ?? [],
          fallbackHandler: safeData.fallbackHandler.value,
          version: safeData.version
        };
      })
    ).catch((error) => {
      log.error(`Error getting gnosis safes for address ${address} on Mantle chain ${chainId}`, { error });
      return [];
    });
  } else {
    const { supported } = isSupportedSafeApiChain(chainId);
    if (supported) {
      const rateLimiter = RateLimit(5);

      const apiClient = await getSafeApiClient({ chainId });
      return apiClient
        .getSafesByOwner(checksumAddress)
        .then((userSafesResponse) =>
          Promise.all(
            userSafesResponse.safes.map(async (safeAddr) => {
              await rateLimiter();
              return apiClient.getSafeInfo(safeAddr).then((info) => ({ ...info, chainId }));
            })
          )
        )
        .catch((error) => {
          log.error(`Error getting gnosis safes for address ${address} on chain ${chainId}`, { error });
          return [];
        });
    } else {
      return [];
    }
  }
}

export async function getSafesForAddresses(addresses: string[], enableTestnets: boolean) {
  const userSafes: SafeData[] = [];

  for (const address of addresses) {
    const safes = await Promise.all(
      getChainList({ enableTestnets }).map((network) => getSafesForAddress({ chainId: network.chainId, address }))
    ).then((list) => list.flat());
    userSafes.push(...safes);
  }

  // de-dupe safes in case user has multiple addresses and they own the same safe
  return userSafes;
}
