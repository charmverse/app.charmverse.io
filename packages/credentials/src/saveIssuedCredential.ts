import { InvalidInputError } from '@charmverse/core/errors';
import type { CredentialEventType, IssuedCredential } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';
import { publishBountyEvent, publishProposalEventBase } from '@packages/lib/webhookPublisher/publishEvent';

type NonNullableValues<T> = {
  [P in keyof T]: NonNullable<T[P]>;
};

/**
 * The unique combination of data that defines a credential
 */
export type IdenticalCredentialProps = {
  credentialTemplateId: string;
  userId: string;
  credentialEvent: CredentialEventType;
  schemaId: string;
  proposalId?: string;
  rewardApplicationId?: string;
};

type IssuedCredentialToSave = {
  credentialProps: IdenticalCredentialProps;
  onChainData: NonNullableValues<Pick<IssuedCredential, 'onchainChainId' | 'onchainAttestationId'>>;
};

export async function saveIssuedCredential({
  credentialProps: { credentialEvent, credentialTemplateId, schemaId, userId, proposalId, rewardApplicationId },
  onChainData
}: IssuedCredentialToSave): Promise<IssuedCredential> {
  if ((!proposalId && !rewardApplicationId) || (proposalId && rewardApplicationId)) {
    throw new InvalidInputError('Either proposalId or rewardApplicationId must be provided');
  }
  if (!onChainData) {
    throw new InvalidInputError('Either offchainData or onChainData must be provided');
  }

  const existingCredential = await prisma.issuedCredential.findFirst({
    where: {
      credentialTemplateId,
      userId,
      credentialEvent,
      // One of these will be undefined
      proposalId,
      rewardApplicationId
    }
  });

  let returnedCredential = existingCredential;

  if (existingCredential) {
    returnedCredential = await prisma.issuedCredential.update({
      where: { id: existingCredential.id },
      data: {
        onchainChainId: onChainData?.onchainChainId,
        onchainAttestationId: onChainData?.onchainAttestationId
      }
    });
  } else {
    returnedCredential = await prisma.issuedCredential.create({
      data: {
        credentialEvent,
        credentialTemplate: { connect: { id: credentialTemplateId } },
        user: { connect: { id: userId } },
        schemaId,
        onchainChainId: onChainData?.onchainChainId,
        onchainAttestationId: onChainData?.onchainAttestationId,
        proposal: proposalId ? { connect: { id: proposalId } } : undefined,
        rewardApplication: rewardApplicationId ? { connect: { id: rewardApplicationId } } : undefined
      }
    });

    if (proposalId) {
      const proposal = await prisma.proposal.findUnique({
        where: {
          id: proposalId
        }
      });

      if (proposal) {
        await publishProposalEventBase({
          scope: WebhookEventNames.ProposalCredentialCreated,
          proposalId,
          spaceId: proposal.spaceId,
          userId
        });
      }
    } else if (rewardApplicationId) {
      const reward = await prisma.bounty.findFirst({
        where: {
          applications: {
            some: {
              id: rewardApplicationId
            }
          }
        }
      });

      if (reward) {
        await publishBountyEvent({
          scope: WebhookEventNames.RewardCredentialCreated,
          applicationId: rewardApplicationId,
          userId: returnedCredential.userId,
          bountyId: reward.id,
          spaceId: reward.spaceId
        });
      }
    }
  }

  return returnedCredential;
}
