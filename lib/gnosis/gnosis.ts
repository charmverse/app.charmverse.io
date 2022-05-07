
import { Signer, ethers } from 'ethers';
import { RPC } from 'connectors';
import { UserMultiSigWallet } from '@prisma/client';
import EthersAdapter from '@gnosis.pm/safe-ethers-lib';
import SafeServiceClient, { SafeMultisigTransactionResponse, SafeInfoResponse, AllTransactionsListResponse } from '@gnosis.pm/safe-service-client';

export type GnosisTransaction = SafeMultisigTransactionResponse;// AllTransactionsListResponse['results'][0];

function getGnosisRPCUrl (chainId: number) {
  const network = Object.values(RPC).find(rpc => rpc.chainId === chainId);
  return network?.gnosisUrl;
}

interface GetGnosisServiceProps {
  signer: ethers.Signer;
  chainId?: number;
  gnosisUrl?: string;
}

function getGnosisService ({ signer, chainId, gnosisUrl }: GetGnosisServiceProps): SafeServiceClient | null {

  const txServiceUrl = gnosisUrl || (chainId && getGnosisRPCUrl(chainId));
  if (!txServiceUrl) {
    return null;
  }

  const ethAdapter = new EthersAdapter({
    ethers,
    signer
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

async function getSafesForAddress ({ signer, chainId, address }: GetSafesForAddressProps): Promise<({ chainId: number } & SafeInfoResponse)[]> {
  const gnosisUrl = getGnosisRPCUrl(chainId);
  if (!gnosisUrl) {
    return [];
  }
  const service = getGnosisService({ signer, gnosisUrl });
  if (service) {
    return service.getSafesByOwner(address)
      .then(r => Promise.all(r.safes.map(safeAddr => {
        return service.getSafeInfo(safeAddr)
          .then(info => ({ ...info, chainId }));
      })));
  }
  return [];
}

export async function getSafesForAddresses (signer: ethers.Signer, addresses: string[]) {
  const safes = await Promise.all(Object.values(RPC).map(network => {
    return Promise.all(addresses.map(address => getSafesForAddress({ signer, chainId: network.chainId, address })));
  })).then(list => list.flat().flat());

  return safes;
}

async function getTransactionsforSafe (signer: Signer, wallet: UserMultiSigWallet): Promise<GnosisTransaction[]> {
  const service = getGnosisService({ signer, chainId: wallet.chainId });
  if (service) {
    // const transactions = await service.getMultisigTransactions(wallet.address);
    // return transactions.results;
    const transactions = await service.getPendingTransactions(wallet.address);
    console.log(transactions);
    // TODO: not sure if we actually need to get transaction info again
    const withInfo = await Promise.all(transactions.results.map(transaction => service.getTransaction(transaction.safeTxHash)));
    return withInfo;
  }
  return [];
}

export async function getTransactionsforSafes (signer: Signer, wallets: UserMultiSigWallet[]) {
  return Promise.all(wallets.map(wallet => getTransactionsforSafe(signer, wallet)))
    .then(list => list.flat());
}
