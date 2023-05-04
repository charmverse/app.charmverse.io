import type { UserGnosisSafe } from '@charmverse/core/dist/prisma';
import EthersAdapter from '@safe-global/safe-ethers-lib';
import type { SafeInfoResponse, SafeMultisigTransactionListResponse } from '@safe-global/safe-service-client';
import SafeServiceClient from '@safe-global/safe-service-client';
import { getChainById, RPC } from 'connectors';
import type { Signer } from 'ethers';
import { ethers } from 'ethers';
import { getAddress } from 'ethers/lib/utils';
import uniqBy from 'lodash/uniqBy';

import log from 'lib/log';

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
  signer: ethers.Signer;
  address: string;
  chainId: number;
}

export type SafeData = { chainId: number } & SafeInfoResponse;

export async function getSafesForAddress({ signer, chainId, address }: GetSafesForAddressProps): Promise<SafeData[]> {
  const serviceUrl = getGnosisRPCUrl(chainId);
  if (!serviceUrl) {
    return [];
  }
  const service = getGnosisService({ signer, serviceUrl });
  if (service) {
    const checksumAddress = getAddress(address); // convert to checksum address
    return service.getSafesByOwner(checksumAddress).then((r) =>
      Promise.all(
        r.safes.map((safeAddr) => {
          return service.getSafeInfo(safeAddr).then((info) => ({ ...info, chainId }));
        })
      )
    );
  }
  return [];
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
  const service = getGnosisService({ signer, chainId: wallet.chainId });
  if (service) {
    const transactions = await service.getPendingTransactions(wallet.address);
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
