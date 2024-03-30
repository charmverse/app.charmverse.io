import { log } from '@charmverse/core/log';
import EthersAdapter from '@safe-global/safe-ethers-lib';
import type { SafeInfoResponse, SafeMultisigTransactionListResponse } from '@safe-global/safe-service-client';
import SafeServiceClient from '@safe-global/safe-service-client';
import { RateLimit } from 'async-sema';
import { getChainList, getChainById } from 'connectors/chains';
import { ethers } from 'ethers';
import uniqBy from 'lodash/uniqBy';
import { getAddress } from 'viem';
import { mantle, mantleTestnet } from 'viem/chains';

import { getMantleSafeData, getMantleSafesByOwner } from './mantleClient';
import { getSafeApiClient } from './safe/getSafeApiClient';
import { isSupportedSafeApiChain } from './safe/isSupportedSafeApiChain';

export type GnosisTransaction = SafeMultisigTransactionListResponse['results'][number];

function getGnosisRPCUrl(chainId: number) {
  return getChainById(chainId)?.gnosisUrl;
}

interface GetGnosisServiceProps {
  signer: ethers.Signer | ethers.providers.Provider;
  chainId?: number;
  serviceUrl?: string;
}

export function getGnosisService({ signer, chainId, serviceUrl }: GetGnosisServiceProps): SafeServiceClient | null {
  const txServiceUrl = serviceUrl || (chainId && getGnosisRPCUrl(chainId));
  if (!txServiceUrl) {
    return null;
  }

  const ethAdapter = new EthersAdapter({
    ethers,
    signerOrProvider: signer
  });

  const safeService = new SafeServiceClient({
    txServiceUrl,
    ethAdapter
  });

  return safeService;
}

interface GetSafesForAddressProps {
  address: string;
  chainId: number;
}

export type SafeData = { chainId: number } & Omit<SafeInfoResponse, 'masterCopy'>;

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
    });

    return Promise.all(
      safes.map(async (safeAddr) => {
        const safeData = await getMantleSafeData({ serviceUrl, chainId, address: getAddress(safeAddr) });
        return {
          chainId,
          address: safeAddr,
          nonce: safeData.nonce,
          threshold: safeData.threshold,
          masterCopy: safeData.implementation.value,
          owners: safeData.owners.map((owner) => owner.value),
          modules: safeData.modules ?? [],
          fallbackHandler: safeData.fallbackHandler.value,
          version: safeData.version
        };
      })
    );
  } else {
    const { supported } = isSupportedSafeApiChain(chainId);
    if (supported) {
      const rateLimiter = RateLimit(5);

      const apiClient = getSafeApiClient({ chainId });
      return apiClient.getSafesByOwner(checksumAddress).then((userSafesResponse) =>
        Promise.all(
          userSafesResponse.safes.map(async (safeAddr) => {
            await rateLimiter();
            return apiClient.getSafeInfo(safeAddr).then((info) => ({ ...info, chainId }));
          })
        )
      );
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
  return uniqBy(userSafes, (safe) => safe.address);
}
