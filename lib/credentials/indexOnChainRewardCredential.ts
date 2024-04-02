import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type {
  CredentialEventType,
  IssuedCredential,
  PendingSafeTransaction,
  Prisma
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import type { EAS } from '@ethereum-attestation-service/eas-sdk';
import { JsonRpcProvider } from '@ethersproject/providers';
import { RateLimit } from 'async-sema';
import { getChainById } from 'connectors/chains';
import { sepolia } from 'viem/chains';

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

async function getProposalContentToIndex({
  chainId,
  attestationId,
  eas
}: IndexableCredential & {
  eas: EAS;
  chainId: EasSchemaChain;
}): Promise<Prisma.IssuedCredentialCreateManyInput | null> {
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
    return null;
  }

  return {
    credentialEvent,
    credentialTemplateId: matchingCredentialTemplate.id,
    userId: proposal.authors[0].userId,
    proposalId: proposal.id,
    schemaId: attestation.schema,
    onchainChainId: chainId,
    onchainAttestationId: attestationId
  };
}

// Avoid spamming RPC with requests
const limiter = RateLimit(10);

export type ProposalCredentialsToIndex = {
  chainId: EasSchemaChain;
  txHash: string;
};

export async function indexProposalCredentials({ chainId, txHash }: ProposalCredentialsToIndex): Promise<void> {
  const publicClient = getPublicClient(chainId);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}`, confirmations: 1 });

  const attestationUids = receipt.logs.map((_log) => _log.data);

  const eas = await getEasInstance(chainId);
  eas.connect(new JsonRpcProvider(getChainById(chainId)?.rpcUrls[0] as string, chainId));

  const issuedCredentialInputs = await Promise.all(
    attestationUids.map(async (uid) => {
      await limiter();
      return getProposalContentToIndex({ attestationId: uid, chainId, eas });
    })
  );

  await prisma.issuedCredential.createMany({
    data: issuedCredentialInputs.filter((input): input is Prisma.IssuedCredentialCreateManyInput => !!input)
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
