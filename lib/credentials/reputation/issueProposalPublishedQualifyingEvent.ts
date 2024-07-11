import { InvalidInputError } from '@charmverse/core/dist/cjs/errors';
import { stringUtils } from '@charmverse/core/dist/cjs/utilities';
import { prisma, type CharmCredential } from '@charmverse/core/prisma-client';

import { fancyTrim } from 'lib/utils/strings';

import { attestOnchain } from '../attestOnchain';
import { attestationSchemaIds } from '../schemas';

import { charmCredentialChainId } from './constants';
import { getUserIdentifier } from './getUserIdentifier';

export async function issueProposalPublishedQualifyingEvent({
  proposalId,
  userId
}: {
  proposalId: string;
  userId: string;
}): Promise<CharmCredential> {
  if (!stringUtils.isUUID(proposalId)) {
    throw new InvalidInputError('Invalid proposalId');
  } else if (!stringUtils.isUUID(userId)) {
    throw new InvalidInputError('Invalid userId');
  }

  const existingAttestation = await prisma.charmCredential.findFirst({
    where: {
      type: 'qualifying_event',
      userId,
      proposalId,
      qualifyingEventType: 'proposal_published'
    }
  });

  if (existingAttestation) {
    return existingAttestation;
  }

  const userIdentifier = await getUserIdentifier({ userId });

  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    select: {
      page: {
        select: {
          title: true
        }
      },
      space: {
        select: {
          name: true
        }
      }
    }
  });

  const newAttestation = await prisma.$transaction(async (tx) => {
    const attestationUID = await attestOnchain({
      chainId: charmCredentialChainId,
      type: 'charmQualifyingEvent',
      credentialInputs: {
        recipient: null,
        data: {
          category: 'proposal_published',
          userRefUID: userIdentifier.attestationUID,
          name: `Published ${fancyTrim(proposal.page?.title.trim(), 100)} proposal in ${fancyTrim(
            proposal.space?.name.trim(),
            100
          )}`,
          metadataSnapshotRefUID: '',
          projectRefUID: ''
        }
      }
    });

    return prisma.charmCredential.create({
      data: {
        type: 'qualifying_event',
        attestationUID,
        chainId: charmCredentialChainId,
        qualifyingEventType: 'proposal_published',
        schemaId: attestationSchemaIds.charmQualifyingEvent,
        user: {
          connect: {
            id: userId
          }
        }
      }
    });
  });

  return newAttestation;
}
