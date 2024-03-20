import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';
import type { EAS } from '@ethereum-attestation-service/eas-sdk';
import { RateLimit } from 'async-sema';

import { lowerCaseEqual } from 'lib/utils/strings';

import type { EasSchemaChain } from './connectors';
import { getEasInstance } from './connectors';
import type { IssuableProposalCredentialContent } from './findIssuableProposalCredentials';
import { getCharmverseSigner } from './getCharmverseSigner';
import type { ProposalCredential } from './schemas/proposal';
import { decodeProposalCredential } from './schemas/proposal';

type IndexableCredential = {
  attestationId: string;
  issuableCredential: IssuableProposalCredentialContent;
};

async function indexOnChainProposalCredential({
  chainId,
  attestationId,
  issuableCredential,
  eas,
  expectedIssuerAddress
}: IndexableCredential & { eas: EAS; chainId: EasSchemaChain; expectedIssuerAddress?: string }): Promise<void> {
  const attestation = await eas.getAttestation(attestationId);
  if (expectedIssuerAddress && !lowerCaseEqual(expectedIssuerAddress, attestation.attester)) {
    throw new InvalidInputError(
      `Attestation ${attestationId} on chain ${chainId} was issued by ${attestation.attester}, but expected issuer was ${expectedIssuerAddress}`
    );
  }

  const decoded = decodeProposalCredential(attestation.data) as ProposalCredential;

  const pagePermalinkId = decoded.URL.split('/').pop();

  if (!pagePermalinkId || !stringUtils.isUUID(pagePermalinkId)) {
    throw new Error(`Invalid page permalink ID for credential ${attestationId} on ${chainId}`);
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
      id: true
    }
  });

  await prisma.issuedCredential.create({
    data: {
      credentialEvent: issuableCredential.event,
      credentialTemplate: { connect: { id: issuableCredential.credentialTemplateId } },
      onchainAttestationId: attestationId,
      user: { connect: { id: issuableCredential.recipientUserId } },
      proposal: { connect: { id: proposal.id } },
      schemaId: attestation.schema,
      onchainChainId: chainId
    }
  });
}

type ProposalCredentialsToIndex = {
  chainId: EasSchemaChain;
  attestations: IndexableCredential[];
};

export async function bulkIndexProposalCredentials({ chainId, attestations }: ProposalCredentialsToIndex) {
  const provider = getCharmverseSigner({ chainId });
  const eas = getEasInstance(chainId);
  await eas.connect(provider);

  const limiter = RateLimit(10);

  await Promise.allSettled(
    attestations.map(async (attestation) => {
      await limiter();
      await indexOnChainProposalCredential({ ...attestation, chainId, eas });
    })
  );
}
