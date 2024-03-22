import { InvalidInputError } from '@charmverse/core/errors';
import type { CredentialEventType, IssuedCredential, PendingSafeTransaction } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import type { EAS } from '@ethereum-attestation-service/eas-sdk';
import { JsonRpcProvider } from '@ethersproject/providers';
import { RateLimit } from 'async-sema';
import { getChainById } from 'connectors/chains';

import { getPublicClient } from 'lib/blockchain/publicClient';
import { getSafeApiClient } from 'lib/gnosis/safe/getSafeApiClient';
import { lowerCaseEqual, prettyPrint } from 'lib/utils/strings';

import { getEasInstance, type EasSchemaChain } from './connectors';
import { proposalApprovedVerb, proposalCreatedVerb } from './constants';
import type { PartialIssuableProposalCredentialContent } from './findIssuableProposalCredentials';
import type { ProposalCredential } from './schemas/proposal';
import { decodeProposalCredential } from './schemas/proposal';

type IndexableCredential = {
  attestationId: string;
};

async function indexOnChainProposalCredential({
  chainId,
  attestationId,
  eas
}: IndexableCredential & {
  eas: EAS;
  chainId: EasSchemaChain;
}): Promise<IssuedCredential> {
  const attestation = await eas.getAttestation(attestationId);

  const decodedContent = decodeProposalCredential(attestation.data) as ProposalCredential;

  const pagePermalinkId = decodedContent.URL.split('/').pop();

  if (!pagePermalinkId || !stringUtils.isUUID(pagePermalinkId)) {
    throw new InvalidInputError(`Invalid page permalink ID for credential ${attestationId} on ${chainId}`);
  }

  // Sanity check to ensure the proposal exists in our db
  const proposal = await prisma.proposal.findFirstOrThrow({
    where: {
      page: {
        id: pagePermalinkId,
        type: 'proposal'
      }
    },
    select: {
      id: true,
      selectedCredentialTemplates: true,
      spaceId: true,
      space: {
        select: {
          credentialsWallet: true
        }
      },
      authors: {
        where: {
          author: {
            wallets: {
              some: {
                address: attestation.recipient.toLowerCase()
              }
            }
          }
        }
      }
    }
  });

  if (!proposal.authors.length) {
    throw new InvalidInputError(
      `No author with wallet address ${attestation.recipient} found for proposal ${proposal.id}`
    );
  }

  if (!lowerCaseEqual(proposal.space.credentialsWallet, attestation.attester)) {
    throw new InvalidInputError(
      `Proposal ${proposal.id} was issued on chain ${chainId} by ${attestation.recipient}, but credentials wallet is ${proposal.space.credentialsWallet}`
    );
  }

  const credentialEvent: CredentialEventType | null = decodedContent.Event.match(proposalCreatedVerb)
    ? 'proposal_created'
    : decodedContent.Event.match(proposalApprovedVerb)
    ? 'proposal_approved'
    : null;

  if (!credentialEvent) {
    throw new InvalidInputError(`Invalid event ${decodedContent.Event} for credential ${attestationId} on ${chainId}`);
  }

  const matchingCredentialTemplate = await prisma.credentialTemplate.findFirstOrThrow({
    where: {
      spaceId: proposal.spaceId,
      name: decodedContent.Name,
      description: decodedContent.Description,
      id: {
        in: proposal.selectedCredentialTemplates
      }
    }
  });

  const existingCredential = await prisma.issuedCredential.findFirst({
    where: {
      onchainChainId: chainId,
      onchainAttestationId: attestationId
    }
  });

  // If we already indexed this attestation, no need to reindex it
  if (existingCredential) {
    return existingCredential;
  }

  const issuedCredential = await prisma.issuedCredential.create({
    data: {
      credentialEvent,
      credentialTemplate: { connect: { id: matchingCredentialTemplate.id } },
      user: { connect: { id: proposal.authors[0].userId } },
      proposal: { connect: { id: proposal.id } },
      schemaId: attestation.schema,
      onchainChainId: chainId,
      onchainAttestationId: attestationId
    }
  });

  return issuedCredential;
}

// Avoid spamming RPC with requests
const limiter = RateLimit(10);

export type ProposalCredentialsToIndex = {
  chainId: EasSchemaChain;
  txHash: string;
};

export async function indexProposalCredentials({
  chainId,
  txHash
}: ProposalCredentialsToIndex): Promise<IssuedCredential[]> {
  const publicClient = getPublicClient(chainId);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}`, confirmations: 1 });

  const attestationUids = receipt.logs.map((log) => log.data);

  const eas = await getEasInstance(chainId);
  eas.connect(new JsonRpcProvider(getChainById(chainId)?.rpcUrls[0] as string, chainId));

  await indexOnChainProposalCredential({ attestationId: attestationUids[0], chainId, eas });

  const issuedCredentials = await Promise.allSettled(
    attestationUids.map(async (uid) => {
      await limiter();
      return indexOnChainProposalCredential({ attestationId: uid, chainId, eas });
    })
  ).then((results) =>
    results
      .filter((result) => result.status === 'fulfilled')
      .map((result) => (result as PromiseFulfilledResult<IssuedCredential>).value)
  );

  return issuedCredentials;
}

export type GnosisSafeTransactionToIndex = Pick<
  PendingSafeTransaction,
  'safeTxHash' | 'chainId' | 'safeAddress' | 'spaceId' | 'schemaId'
> & { credentials: PartialIssuableProposalCredentialContent[] };

export type TypedPendingGnosisSafeTransaction = Omit<PendingSafeTransaction, 'credentialContent'> & {
  credentialContent: Record<string, PartialIssuableProposalCredentialContent[]>;
};

export async function saveGnosisSafeTransactionToIndex({
  chainId,
  credentials,
  safeAddress,
  safeTxHash,
  schemaId,
  spaceId
}: GnosisSafeTransactionToIndex): Promise<PendingSafeTransaction> {
  const { proposalIds, credentialContent } = credentials.reduce(
    (acc, val) => {
      acc.proposalIds.push(val.proposalId);

      if (!acc.credentialContent[val.proposalId]) {
        acc.credentialContent[val.proposalId] = [];
      }

      acc.credentialContent[val.proposalId].push(val);

      return acc;
    },
    {
      proposalIds: [] as string[],
      credentialContent: {} as Record<string, PartialIssuableProposalCredentialContent[]>
    }
  );

  const pendingSafeTransactionToIndex = await prisma.pendingSafeTransaction.create({
    data: {
      space: { connect: { id: spaceId } },
      schemaId,
      safeTxHash,
      safeAddress,
      chainId,
      proposalIds,
      processed: false,
      credentialContent
    }
  });

  return pendingSafeTransactionToIndex as TypedPendingGnosisSafeTransaction;
}

export async function indexSafeTransaction({
  safeTxHash,
  chainId
}: {
  safeTxHash: string;
  chainId: number;
}): Promise<IssuedCredential[]> {
  const apiClient = getSafeApiClient({ chainId });
  const pendingSafeTransaction = await apiClient.getTransaction(safeTxHash);

  prettyPrint(pendingSafeTransaction.transactionHash);

  return [];
}

// indexSafeTransaction({
//   chainId: sepolia.id,
//   safeTxHash: '0x6773a9797f19a1c7e9f70819024eb29f4c68573fb89c6821d192656f3689a310'
// }).then(console.log);
