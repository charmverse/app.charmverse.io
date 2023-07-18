import { log } from '@charmverse/core/log';
import type { UserGnosisSafe } from '@charmverse/core/prisma';
import EthersAdapter from '@safe-global/safe-ethers-lib';
import type { SafeInfoResponse, SafeMultisigTransactionListResponse } from '@safe-global/safe-service-client';
import SafeServiceClient from '@safe-global/safe-service-client';
import { getChainById, RPC } from 'connectors';
import type { Signer } from 'ethers';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import uniqBy from 'lodash/uniqBy';

import * as http from 'adapters/http';

export type GnosisTransaction = SafeMultisigTransactionListResponse['results'][number];

function getGnosisRPCUrl(chainId: number) {
  return getChainById(chainId)?.gnosisUrl;
}

interface GetGnosisServiceProps {
  signer: ethers.Signer | ethers.providers.Provider;
  chainId?: number;
  serviceUrl?: string;
}

export function getGnosisService({ signer, chainId, serviceUrl }: GetGnosisServiceProps): {
  safeService: SafeServiceClient | null;
  ethAdapter: EthersAdapter;
} | null {
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

  return {
    safeService,
    ethAdapter
  };
}

interface GetSafesForAddressProps {
  signer: ethers.Signer;
  address: string;
  chainId: number;
}

export type SafeData = { chainId: number } & SafeInfoResponse;

type MantleMultisigSafe = {
  address: {
    value: string;
  };
  chainId: string;
  nonce: number;
  threshold: number;
  owners: {
    value: string;
  }[];
  implementation: {
    value: string;
  };
  modules: null;
  fallbackHandler: {
    value: string;
  };
  guard: null;
  version: string;
  implementationVersionState: string;
  collectiblesTag: string;
  txQueuedTag: string;
  txHistoryTag: string;
  messagesTag: string;
};

export async function getSafesForAddress({ signer, chainId, address }: GetSafesForAddressProps): Promise<SafeData[]> {
  const serviceUrl = getGnosisRPCUrl(chainId);
  if (!serviceUrl) {
    return [];
  }

  const gnosisService = getGnosisService({ signer, serviceUrl });
  const safeService = gnosisService?.safeService;
  const ethAdapter = gnosisService?.ethAdapter;
  if (!safeService || !ethAdapter) {
    return [];
  }

  const checksumAddress = getAddress(address); // convert to checksum address
  if (chainId === 5001 || chainId === 5000) {
    const { address: eip3770Address } = await ethAdapter.getEip3770Address(checksumAddress);
    const safes = await http.GET<string[]>(`${serviceUrl}/v1/chains/${chainId}/owners/${eip3770Address}/safes`);
    return Promise.all(
      safes.map(async (safeAddr) => {
        const { address: eip3770SafeAddress } = await ethAdapter.getEip3770Address(safeAddr);
        const safeData = await http.GET<MantleMultisigSafe>(
          `${serviceUrl}/v1/chains/${chainId}/safes/${eip3770SafeAddress}`
        );
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
    return safeService.getSafesByOwner(checksumAddress).then((r) =>
      Promise.all(
        r.safes.map((safeAddr) => {
          return safeService.getSafeInfo(safeAddr).then((info) => ({ ...info, chainId }));
        })
      )
    );
  }
}

export async function getSafesForAddresses(signer: ethers.Signer, addresses: string[]) {
  const safes = await Promise.all(
    Object.values(RPC).map((network) => {
      return Promise.all(addresses.map((address) => getSafesForAddress({ signer, chainId: network.chainId, address })));
    })
  ).then((list) => list.flat().flat());

  // de-dupe safes in case user has multiple addresses and they own the same safe
  return uniqBy(safes, (safe) => safe.address);
}

async function getTransactionsforSafe(signer: Signer, wallet: UserGnosisSafe): Promise<GnosisTransaction[]> {
  const gnosisService = getGnosisService({ signer, chainId: wallet.chainId });
  if (gnosisService?.safeService) {
    const transactions = await gnosisService.safeService.getPendingTransactions(wallet.address);
    return transactions.results;
  }
  return [];
}

export async function getTransactionsforSafes(signer: Signer, safes: UserGnosisSafe[]) {
  const transactionList: GnosisTransaction[] = [];
  for (const safe of safes) {
    try {
      const transactions = await getTransactionsforSafe(signer, safe);
      transactionList.push(...transactions);
    } catch (e) {
      log.warn(`Error getting transactions for safe ${safe.address}`, e);
    }
  }
  return transactionList;
}
