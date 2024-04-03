import { InvalidInputError } from '@charmverse/core/errors';
import type { CredentialEventType, IssuedCredential, Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import type { EAS } from '@ethereum-attestation-service/eas-sdk';
import { JsonRpcProvider } from '@ethersproject/providers';
import { RateLimit } from 'async-sema';
import { getChainById } from 'connectors/chains';

import { getPublicClient } from 'lib/blockchain/publicClient';
import { lowerCaseEqual } from 'lib/utils/strings';

import { getEasInstance, type EasSchemaChain } from './connectors';
import { proposalApprovedVerb, proposalCreatedVerb } from './constants';
import { saveIssuedCredential } from './saveIssuedCredential';
import type { ProposalCredential } from './schemas/proposal';
import { decodeProposalCredential } from './schemas/proposal';

type IndexableCredential = {
  attestationId: string;
};

async function indexOnchainProposalCredential({
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

  const issuedCredential = await saveIssuedCredential({
    credentialProps: {
      credentialEvent,
      credentialTemplateId: matchingCredentialTemplate.id,
      schemaId: attestation.schema,
      userId: proposal.authors[0].userId,
      proposalId: proposal.id
    },
    onChainData: {
      onchainAttestationId: attestationId,
      onchainChainId: chainId
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

/**
 * Compatible with EOA transaction. Todo - Add support for safe
 */
export async function indexProposalCredentials({ chainId, txHash }: ProposalCredentialsToIndex): Promise<void> {
  const publicClient = getPublicClient(chainId);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}`, confirmations: 1 });

  const attestationUids = receipt.logs.map((_log) => _log.data);

  const eas = await getEasInstance(chainId);
  eas.connect(new JsonRpcProvider(getChainById(chainId)?.rpcUrls[0] as string, chainId));

  await Promise.all(
    attestationUids.map(async (uid) => {
      await limiter();
      return indexOnchainProposalCredential({ attestationId: uid, chainId, eas });
    })
  );
}
