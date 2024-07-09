import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import type { CredentialEventType, CredentialTemplate } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { optimism } from 'viem/chains';

import { getFeatureTitle } from 'lib/features/getFeatureTitle';
import { getSubmissionPagePermalink } from 'lib/pages/getPagePermalink';

import { signPublishAndRecordCharmverseCredential } from './attestOffchain';
import { credentialEventLabels, disableCredentialAutopublish } from './constants';
import type { CredentialDataInput } from './schemas';

export async function issueOffchainRewardCredentialsIfNecessary({
  rewardId,
  event,
  submissionId
}: {
  rewardId: string;
  event: Extract<CredentialEventType, 'reward_submission_approved'>;
  submissionId?: string;
}): Promise<void> {
  if (disableCredentialAutopublish) {
    log.warn('Published credentials are disabled');
    return;
  }

  if (event !== 'reward_submission_approved') {
    throw new InvalidInputError(`Invalid event type: ${event} for reward credentials`);
  }

  const baseReward = await prisma.bounty.findUniqueOrThrow({
    where: {
      id: rewardId
    },
    select: {
      selectedCredentialTemplates: true,
      page: {
        select: {
          id: true,
          path: true
        }
      },
      applications: {
        where: {
          id: submissionId,
          status: {
            in: ['complete', 'processing', 'paid']
          }
        },
        select: {
          id: true,
          createdBy: true
        }
      },
      space: {
        select: {
          id: true,
          useOnchainCredentials: true,
          features: true,
          credentialTemplates: {
            where: {
              credentialEvents: {
                has: event
              }
            }
          }
        }
      }
    }
  });

  if (!baseReward.page) {
    throw new DataNotFoundError(`Reward with id ${rewardId} has no matching page`);
  }

  // If no complete submissions, no selected templates, or no templates available for the event, early exit
  if (
    !baseReward.applications.length ||
    !baseReward.selectedCredentialTemplates?.length ||
    !baseReward.space.credentialTemplates.length
  ) {
    return;
  }

  const issuedCredentials = await prisma.issuedCredential.findMany({
    where: {
      credentialEvent: event,
      rewardApplicationId: {
        in: baseReward.applications.map((app) => app.id)
      }
    }
  });

  // Credential template ids grouped by user id
  const credentialsToIssue: Record<string, { rewardApplicationId: string; credentialTemplateId: string }[]> = {};

  for (const application of baseReward.applications) {
    const submitterUserId = application.createdBy;
    baseReward.selectedCredentialTemplates.forEach((credentialTemplateId) => {
      const userHasNotReceivedCredential = !issuedCredentials.some(
        (issuedCredential) =>
          issuedCredential.credentialTemplateId === credentialTemplateId &&
          issuedCredential.userId === submitterUserId &&
          issuedCredential.rewardApplicationId === application.id &&
          issuedCredential.ceramicId
      );
      if (
        userHasNotReceivedCredential &&
        // Only credentials which match the event will have been returned by the query
        baseReward.space.credentialTemplates.some((t) => t.id === credentialTemplateId)
      ) {
        if (!credentialsToIssue[submitterUserId]) {
          credentialsToIssue[submitterUserId] = [];
        }
        credentialsToIssue[submitterUserId].push({
          rewardApplicationId: application.id,
          credentialTemplateId
        });
      }
    });
  }

  const uniqueSubmitters = Object.keys(credentialsToIssue);

  for (const submitterUserId of uniqueSubmitters) {
    const submitter = await prisma.user.findUniqueOrThrow({
      where: {
        id: submitterUserId
      },
      select: {
        wallets: true,
        primaryWallet: true
      }
    });

    const credentialsToGiveUser = credentialsToIssue[submitterUserId].map((cred) => ({
      ...(baseReward.space.credentialTemplates.find((t) => t.id === cred.credentialTemplateId) as CredentialTemplate),
      applicationId: cred.rewardApplicationId
    }));

    const targetWallet = submitter.primaryWallet ?? submitter.wallets[0];

    if (targetWallet) {
      try {
        for (const credentialTemplate of credentialsToGiveUser) {
          const getEventLabel = credentialEventLabels[event];
          if (!getEventLabel) {
            throw new Error(`No label mapper found for event: ${event}`);
          }
          const eventLabel = getEventLabel((value) => getFeatureTitle(value, baseReward.space.features as any[]));

          const credentialContent: CredentialDataInput<'reward'> = {
            Name: credentialTemplate.name,
            Description: credentialTemplate.description ?? '',
            Organization: credentialTemplate.organization,
            Event: eventLabel,
            rewardURL: getSubmissionPagePermalink({ submissionId: credentialTemplate.applicationId })
          };
          // Iterate through credentials one at a time so we can ensure they're properly created and tracked
          await signPublishAndRecordCharmverseCredential({
            chainId: optimism.id,
            recipient: targetWallet.address,
            credential: {
              type: 'reward',
              data: credentialContent
            },
            credentialTemplateId: credentialTemplate.id,
            event,
            recipientUserId: submitterUserId,
            rewardApplicationId: credentialTemplate.applicationId,
            pageId: baseReward.page.id
          });
        }
      } catch (e) {
        log.error('Failed to issue credential', {
          pageId: baseReward.page.id,
          rewardId,
          userId: submitterUserId,
          credentialsToGiveUser,
          error: e
        });
      }
    }
  }
}
