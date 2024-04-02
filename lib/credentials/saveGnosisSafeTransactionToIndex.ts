import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { AttestationType, PendingSafeTransaction } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { JsonRpcProvider } from '@ethersproject/providers';
import { getChainById } from 'connectors/chains';

import { getSafeApiClient } from 'lib/gnosis/safe/getSafeApiClient';
import { prettyPrint } from 'lib/utils/strings';

import { type EasSchemaChain } from './connectors';
import type { PartialIssuableProposalCredentialContent } from './findIssuableProposalCredentials';
import type { PartialIssuableRewardCredentialContent } from './findIssuableRewardCredentials';

type PendingCredentialContent<T extends AttestationType> = T extends 'proposal'
  ? PartialIssuableProposalCredentialContent
  : T extends 'reward'
  ? PartialIssuableRewardCredentialContent
  : never;

export type GnosisSafeTransactionToIndex<T extends AttestationType = AttestationType> = Pick<
  PendingSafeTransaction,
  'safeTxHash' | 'chainId' | 'safeAddress' | 'spaceId' | 'schemaId'
> & { credentials: PendingCredentialContent<T>[]; type: T };

export type TypedPendingGnosisSafeTransaction<T extends AttestationType> = Omit<
  PendingSafeTransaction,
  'credentialContent'
> & {
  credentialContent: Record<string, PendingCredentialContent<T>[]>;
};

export async function saveGnosisSafeTransactionToIndex<T extends AttestationType>({
  chainId,
  credentials,
  safeAddress,
  safeTxHash,
  schemaId,
  spaceId,
  type
}: GnosisSafeTransactionToIndex<T>): Promise<TypedPendingGnosisSafeTransaction<T>> {
  if (type !== 'proposal' && type !== 'reward') {
    throw new InvalidInputError(`Invalid credential type ${type}`);
  }

  const { ids, credentialContent } = credentials.reduce(
    (acc, val) => {
      const itemId = type === 'proposal' ? val.proposalId : val.rewardApplicationId;

      acc.ids.push(itemId);

      if (!acc.credentialContent[itemId]) {
        acc.credentialContent[itemId] = [];
      }

      acc.credentialContent[itemId].push(val);

      return acc;
    },
    {
      ids: [] as string[],
      credentialContent: {} as Record<string, PendingCredentialContent[]>
    }
  );

  const pendingSafeTransactionToIndex = await prisma.pendingSafeTransaction.create({
    data: {
      space: { connect: { id: spaceId } },
      schemaId,
      safeTxHash,
      safeAddress,
      chainId,
      proposalIds: type === 'reward' ? [] : ids,
      rewardApplicationIds: type === 'proposal' ? [] : ids,
      processed: false,
      credentialContent
    }
  });

  return pendingSafeTransactionToIndex as TypedPendingGnosisSafeTransaction;
}

export type IndexableSafeTransaction = {
  safeTxHash: string;
  chainId: EasSchemaChain;
};

export async function indexSafeTransaction({
  safeTxHash,
  chainId,
  indexer
}: IndexableSafeTransaction & {
  indexer: (input: { txHash: string; chainId: EasSchemaChain }) => Promise<void>;
}): Promise<void> {
  const apiClient = getSafeApiClient({ chainId });
  const pendingSafeTransaction = await apiClient.getTransaction(safeTxHash);

  if (!pendingSafeTransaction) {
    log.info(`Safe transaction ${safeTxHash} not found on chain ${chainId}`);

    await prisma.pendingSafeTransaction.delete({
      where: {
        safeTxHash
      }
    });
    return;
  }

  prettyPrint(pendingSafeTransaction);

  const onchainTxHash = pendingSafeTransaction?.transactionHash;

  if (!onchainTxHash) {
    log.info(`Safe transaction ${safeTxHash} on chain ${chainId} has not been confirmed yet`);
    return;
  }

  const provider = new JsonRpcProvider(getChainById(chainId)?.rpcUrls[0] as string, chainId);

  await indexer({
    chainId: chainId as EasSchemaChain,
    txHash: pendingSafeTransaction.transactionHash
  });

  await prisma.pendingSafeTransaction.update({
    where: { safeTxHash },
    data: { processed: true }
  });
}
// indexSafeTransaction({
//   chainId: sepolia.id,
//   safeTxHash: '0x410992d91c8f58919db7605e8555232497b942f95950a51c0734a1cc6da23883'
// }).then(console.log);

// indexSafeTransaction({
//   chainId: sepolia.id,
//   safeTxHash: '0x6ee2a4967da40389b76a03de7c38a5b45ab48f0fc19baf909387c512207a8841'
// }).then(console.log);
