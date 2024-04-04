import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { AttestationType, IssuedCredential, PendingSafeTransaction } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { getSafeApiClient } from 'lib/gnosis/safe/getSafeApiClient';
import { uniqueValues } from 'lib/utils/array';

import { type EasSchemaChain } from './connectors';
import type { PartialIssuableProposalCredentialContent } from './findIssuableProposalCredentials';
import type { PartialIssuableRewardApplicationCredentialContent } from './findIssuableRewardCredentials';
import { indexOnchainProposalCredentials } from './indexOnChainProposalCredential';
import { indexOnchainRewardCredentials } from './indexOnChainRewardCredential';
import type { IdenticalCredentialProps } from './saveIssuedCredential';

type PendingCredentialContent<T extends AttestationType> = T extends 'proposal'
  ? PartialIssuableProposalCredentialContent
  : T extends 'reward'
  ? PartialIssuableRewardApplicationCredentialContent
  : never;

export type GnosisSafeTransactionToIndex<T extends AttestationType = AttestationType> = Pick<
  PendingSafeTransaction,
  'safeTxHash' | 'chainId' | 'safeAddress' | 'spaceId' | 'schemaId'
> & { credentials: PendingCredentialContent<T>[]; type: T };

/**
 * The type of the pending safe transaction, with the credentials grouped by proposal ID or reward ID
 */
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
      const itemId =
        type === 'proposal'
          ? (val as PendingCredentialContent<'proposal'>).proposalId
          : (val as PendingCredentialContent<'reward'>).rewardId;

      acc.ids.push(itemId);

      if (!acc.credentialContent[itemId]) {
        acc.credentialContent[itemId] = [];
      }

      acc.credentialContent[itemId].push(val);

      return acc;
    },
    {
      ids: [] as string[],
      credentialContent: {} as Record<string, PendingCredentialContent<T>[]>
    }
  );

  if (ids.length === 0) {
    throw new InvalidInputError(`No indexable credentials`);
  }

  const pendingSafeTransactionToIndex = await prisma.pendingSafeTransaction.create({
    data: {
      space: { connect: { id: spaceId } },
      schemaId,
      credentialType: type,
      safeTxHash,
      safeAddress,
      chainId,
      proposalIds: type === 'proposal' ? uniqueValues(ids) : [],
      rewardIds: type === 'reward' ? uniqueValues(ids) : [],
      processed: false,
      credentialContent
    }
  });

  return pendingSafeTransactionToIndex as TypedPendingGnosisSafeTransaction<T>;
}

export type IndexableSafeTransaction = {
  safeTxHash: string;
  chainId: EasSchemaChain;
};

export async function indexGnosisSafeCredentialTransaction({
  safeTxHash,
  chainId
}: IndexableSafeTransaction): Promise<void> {
  const apiClient = await getSafeApiClient({ chainId });
  const pendingSafeTransaction = await apiClient.getTransaction(safeTxHash);

  const onchainTxHash = pendingSafeTransaction?.transactionHash;

  const safetransactionInDb = await prisma.pendingSafeTransaction.findFirstOrThrow({
    where: {
      safeTxHash
    }
  });

  if (!onchainTxHash) {
    const safeInfo = await apiClient.getSafeInfo(pendingSafeTransaction.safe);

    const safeNonce = safeInfo.nonce;

    if (safeNonce > pendingSafeTransaction.nonce) {
      log.info(`Safe transaction ${safeTxHash} on chain ${chainId} has been replaced by another transaction`);
      await prisma.pendingSafeTransaction.delete({
        where: {
          safeTxHash
        }
      });
    } else {
      log.info(`Safe transaction ${safeTxHash} on chain ${chainId} has not been confirmed yet`);
    }
    return;
  }

  const indexer =
    safetransactionInDb.credentialType === 'reward'
      ? indexOnchainRewardCredentials
      : safetransactionInDb.credentialType === 'proposal'
      ? indexOnchainProposalCredentials
      : null;

  if (!indexer) {
    throw new InvalidInputError(`Invalid credential type ${safetransactionInDb.credentialType}. Cannot index`);
  }

  const issuedCredentials = await indexer({
    chainId: chainId as EasSchemaChain,
    txHash: pendingSafeTransaction.transactionHash
  });

  /**
   * Utility to generate a unique key for a credential
   */
  function getKey({
    credentialEvent,
    credentialTemplateId,
    userId,
    proposalId,
    rewardApplicationId
  }: Omit<IdenticalCredentialProps, 'schemaId'>) {
    return `${credentialEvent}-${credentialTemplateId}-${userId}-${proposalId}-${rewardApplicationId}`;
  }

  let newValues = {};

  if (safetransactionInDb.credentialType === 'reward') {
    const mappedCredentialsByApplicationId = issuedCredentials.reduce((acc, val) => {
      const key = getKey({
        credentialTemplateId: val.credentialTemplateId as string,
        rewardApplicationId: val.rewardApplicationId as string,
        credentialEvent: val.credentialEvent,
        userId: val.userId
      });
      acc[key] = val;
      return acc;
    }, {} as Record<string, IssuedCredential>);

    const values = (safetransactionInDb as TypedPendingGnosisSafeTransaction<'reward'>).credentialContent;

    // Create a new map of values that may have failed processing
    newValues = Object.entries(values).reduce((acc, [rewardId, pendingRewardApplicationCredentials]) => {
      const filtered = pendingRewardApplicationCredentials.filter((pendingCredential) => {
        const key = getKey({
          credentialTemplateId: pendingCredential.credentialTemplateId as string,
          rewardApplicationId: pendingCredential.rewardApplicationId as string,
          credentialEvent: pendingCredential.event,
          userId: pendingCredential.recipientUserId
        });
        const issuedCredential = mappedCredentialsByApplicationId[key];

        return !issuedCredential;
      });

      if (filtered.length) {
        acc[rewardId] = filtered;
      }

      return acc;
    }, {} as Record<string, PartialIssuableRewardApplicationCredentialContent[]>);
  } else if (safetransactionInDb.credentialType === 'proposal') {
    const mappedCredentialsByProposalId = issuedCredentials.reduce((acc, val) => {
      const key = getKey({
        credentialTemplateId: val.credentialTemplateId as string,
        rewardApplicationId: val.rewardApplicationId as string,
        credentialEvent: val.credentialEvent,
        userId: val.userId,
        proposalId: val.proposalId as string
      });
      acc[key] = val;
      return acc;
    }, {} as Record<string, IssuedCredential>);

    const values = (safetransactionInDb as TypedPendingGnosisSafeTransaction<'proposal'>).credentialContent;

    // Create a new map of values that may have failed processing
    newValues = Object.entries(values).reduce((acc, [proposalId, pendingProposalCredentials]) => {
      const filtered = pendingProposalCredentials.filter((pendingCredential) => {
        const key = getKey({
          credentialTemplateId: pendingCredential.credentialTemplateId as string,
          proposalId: pendingCredential.proposalId as string,
          credentialEvent: pendingCredential.event,
          userId: pendingCredential.recipientUserId
        });
        const issuedCredential = mappedCredentialsByProposalId[key];

        return !issuedCredential;
      });

      if (filtered.length) {
        acc[proposalId] = filtered;
      }

      return acc;
    }, {} as Record<string, PartialIssuableProposalCredentialContent[]>);
  }

  if (Object.keys(newValues).length === 0) {
    log.info(`All credentials for safe transaction ${safeTxHash} on chain ${chainId} have been processed`);

    await prisma.pendingSafeTransaction.delete({
      where: {
        safeTxHash
      }
    });
  } else {
    // Mark this transaction as processed so we can debug it later
    await prisma.pendingSafeTransaction.update({
      where: { safeTxHash },
      data: { processed: true, credentialContent: newValues }
    });
  }
}

// First
// indexGnosisSafeCredentialTransaction({
//   chainId: sepolia.id,
//   safeTxHash: '0x27a3bd51b76720fff43ab0c78240b4b31ad2ea12cddbbb12aa1bea8ab2f43aa8'
// }).then(console.log);

// Second
// indexGnosisSafeCredentialTransaction({
//   chainId: sepolia.id,
//   safeTxHash: '0xa733df3fadac83e64ebbd028d9e323fd9e92612572fee756429174af71a23762'
// }).then(console.log);

// indexGnosisSafeCredentialTransaction({
//   chainId: sepolia.id,
//   safeTxHash: '0xe94b6caf24c7e14679df8c069be5c976c63648c0bb07cee63258ab556586b32b'
// }).then(console.log);
