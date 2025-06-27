import type { CharmQualifyingEventCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import { log } from '@packages/core/log';
import { stringUtils } from '@packages/core/utilities';
import { fancyTrim } from '@packages/utils/strings';
import { optimismSepolia } from 'viem/chains';

import { attestOnchain } from '../attestOnchain';
import type { EasSchemaChain } from '../connectors';
import { attestationSchemaIds } from '../schemas';
import { charmQualifyingEventSchemaId } from '../schemas/charmQualifyingEvent';

import { getUserIdentifier } from './getUserIdentifier';
import { issueUserIdentifierIfNecessary } from './issueUserIdentifier';

export async function issueProposalPublishedQualifyingEvent({
  proposalId,
  userId,
  chainId
}: {
  proposalId: string;
  userId: string;
  chainId: EasSchemaChain;
}): Promise<CharmQualifyingEventCredential> {
  if (!stringUtils.isUUID(proposalId)) {
    throw new InvalidInputError('Invalid proposalId');
  } else if (!stringUtils.isUUID(userId)) {
    throw new InvalidInputError('Invalid userId');
  }

  const currentSchema = charmQualifyingEventSchemaId;

  const existingAttestation = await prisma.charmQualifyingEventCredential.findFirst({
    where: {
      userId,
      proposalId,
      chainId,
      qualifyingEventType: 'proposal_published'
    }
  });

  if (existingAttestation && existingAttestation.schemaId === currentSchema) {
    log.info('Attestation already exists');
    return existingAttestation;
  }

  let userIdentifier = await getUserIdentifier({ userId });

  if (!userIdentifier) {
    userIdentifier = await issueUserIdentifierIfNecessary({
      chainId: optimismSepolia.id,
      userId
    });
  }

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

  const userWallet = await prisma.userWallet.findFirstOrThrow({
    where: {
      userId
    }
  });

  const attestationUID = await attestOnchain({
    chainId,
    type: 'charmQualifyingEvent',
    credentialInputs: {
      recipient: userWallet.address,
      data: {
        category: 'proposal_published',
        userRefUID: userIdentifier!.attestationUID,
        name: `Published ${fancyTrim(proposal.page?.title.trim(), 100)} proposal in ${fancyTrim(
          proposal.space?.name.trim(),
          100
        )}`,
        metadataSnapshotRefUID: '',
        projectRefUID: ''
      }
    }
  });

  return prisma.charmQualifyingEventCredential.create({
    data: {
      attestationUID,
      chainId,
      qualifyingEventType: 'proposal_published',
      schemaId: attestationSchemaIds.charmQualifyingEvent,
      user: {
        connect: {
          id: userId
        }
      }
    }
  });
}
