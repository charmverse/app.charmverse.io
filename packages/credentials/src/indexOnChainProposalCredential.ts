import { InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { CredentialEventType, IssuedCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import type { EAS } from '@ethereum-attestation-service/eas-sdk';
import { getChainById } from '@packages/blockchain/connectors/chains';
import { getPublicClient } from '@packages/lib/blockchain/publicClient';
import { lowerCaseEqual } from '@packages/utils/strings';
import { RateLimit } from 'async-sema';
import { JsonRpcProvider } from 'ethers';

import { getEasConnector, type EasSchemaChain } from './connectors';
import { proposalApprovedVerb } from './constants';
import { getEasInstance } from './getEasInstance';
import { saveIssuedCredential } from './saveIssuedCredential';
import type { ProposalCredential } from './schemas/proposal';
import { decodeProposalCredential } from './schemas/proposalUtils';

type IndexableCredential = {
  attestationId: string;
};

async function indexSingleOnchainProposalCredential({
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
      issuedCredentials: true,
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

  const existingCredential = proposal.issuedCredentials.find((c) => c.onchainAttestationId === attestationId);

  if (existingCredential) {
    return existingCredential;
  }

  if (!proposal.authors.length) {
    throw new InvalidInputError(
      `No author with wallet address ${attestation.recipient} found for proposal ${proposal.id}`
    );
  }

  const credentialEvent: CredentialEventType | null = decodedContent.Event.match(proposalApprovedVerb)
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
export async function indexOnchainProposalCredentials({
  chainId,
  txHash
}: ProposalCredentialsToIndex): Promise<IssuedCredential[]> {
  const publicClient = getPublicClient(chainId);

  const receipt = await publicClient.waitForTransactionReceipt({ hash: txHash as `0x${string}`, confirmations: 1 });

  const attestationContract = getEasConnector(chainId).attestationContract;

  const attestationUids = receipt.logs
    .filter((txLog) => lowerCaseEqual(txLog.address, attestationContract))
    .map((txLog) => txLog.data);

  const eas = getEasInstance(chainId);
  eas.connect(new JsonRpcProvider(getChainById(chainId)?.rpcUrls[0] as string, chainId));

  const credentials = await Promise.all(
    attestationUids.map(async (uid) => {
      await limiter();
      return indexSingleOnchainProposalCredential({ attestationId: uid, chainId, eas }).catch((e) => {
        log.error(`Failed to index credential ${uid} on ${chainId}`, { error: e });
      });
    })
  ).then((data) => data.filter(Boolean));

  return credentials as IssuedCredential[];
}
