import type {
  ApplicationStatus,
  CredentialTemplate,
  IssuedCredential,
  Prisma,
  Space,
  CredentialEventType
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { lowerCaseEqual } from '@packages/utils/strings';
import { getFeatureTitle } from '@root/lib/features/getFeatureTitle';
import { getSubmissionPagePermalink } from '@root/lib/pages/getPagePermalink';

import { credentialEventLabels } from './constants';
import type { TypedPendingGnosisSafeTransaction } from './indexGnosisSafeCredentialTransaction';
import type { CredentialDataInput } from './schemas/interfaces';

export type RewardWithJoinedData = {
  id: string;
  selectedCredentialTemplates: string[];
  applications: {
    id: string;
    createdBy: string;
    status: ApplicationStatus;
    applicant: { id: string; primaryWallet: { address: string } | null; wallets: { address: string }[] };
    issuedCredentials: Pick<
      IssuedCredential,
      'userId' | 'credentialTemplateId' | 'credentialEvent' | 'onchainAttestationId'
    >[];
  }[];
  page: {
    id: string;
  };
};

export type IssuableRewardApplicationCredentialContent = {
  recipientAddress: string;
  recipientUserId: string;
  credential: CredentialDataInput<'reward'>;
  credentialTemplateId: string;
  rewardApplicationId: string;
  rewardId: string;
  rewardPageId: string;
  event: Extract<CredentialEventType, 'reward_submission_approved'>;
};

// A partial subtype to reduce data passed around the system
export type PartialIssuableRewardApplicationCredentialContent = Pick<
  IssuableRewardApplicationCredentialContent,
  'rewardApplicationId' | 'event' | 'credentialTemplateId' | 'recipientAddress' | 'rewardId' | 'recipientUserId'
>;

type GenerateRewardCredentialsParams = {
  reward: RewardWithJoinedData;
  space: Pick<Space, 'id' | 'features'> & {
    credentialTemplates: Pick<
      CredentialTemplate,
      'credentialEvents' | 'id' | 'name' | 'description' | 'organization' | 'schemaAddress'
    >[];
  };
  pendingIssuableCredentials?: PartialIssuableRewardApplicationCredentialContent[];
};

export function generateCredentialInputsForReward({
  reward,
  space,
  pendingIssuableCredentials
}: GenerateRewardCredentialsParams): IssuableRewardApplicationCredentialContent[] {
  if (!reward.selectedCredentialTemplates.length) {
    return [];
  }

  const templateMap = new Map(space.credentialTemplates.map((t) => [t.id, t]));
  const credentialsToIssue: IssuableRewardApplicationCredentialContent[] = [];

  reward.applications.forEach((application) => {
    if (!['complete', 'processing', 'paid'].includes(application.status)) {
      return;
    }

    reward.selectedCredentialTemplates.forEach((credentialTemplateId) => {
      // Assuming function to fetch primary wallet address or first wallet address
      const targetWallet = application.applicant.primaryWallet?.address ?? application.applicant.wallets[0]?.address;

      if (!targetWallet) {
        return;
      }

      const credentialTemplate = templateMap.get(credentialTemplateId);

      if (
        !credentialTemplate ||
        !credentialTemplate.credentialEvents.includes('reward_submission_approved') ||
        pendingIssuableCredentials?.some(
          (pendingIssuableCred) =>
            pendingIssuableCred.rewardApplicationId === application.id &&
            pendingIssuableCred.credentialTemplateId === credentialTemplateId &&
            pendingIssuableCred.event === 'reward_submission_approved' &&
            lowerCaseEqual(pendingIssuableCred.recipientAddress, targetWallet)
        ) ||
        application.issuedCredentials.some(
          (cred) =>
            cred.userId === application.applicant.id &&
            cred.credentialTemplateId === credentialTemplateId &&
            cred.credentialEvent === 'reward_submission_approved' &&
            cred.onchainAttestationId
        )
      ) {
        return;
      }

      const getEventLabel = credentialEventLabels.reward_submission_approved;
      const eventLabel = getEventLabel ? getEventLabel((value) => getFeatureTitle(value, space.features as any)) : '';

      credentialsToIssue.push({
        recipientAddress: targetWallet,
        recipientUserId: application.createdBy,
        rewardId: reward.id,
        event: 'reward_submission_approved',
        credential: {
          Name: credentialTemplate.name,
          Description: credentialTemplate.description ?? '',
          Organization: credentialTemplate.organization,
          Event: eventLabel,
          rewardURL: getSubmissionPagePermalink({ submissionId: application.id })
        },
        rewardPageId: reward.page.id,
        rewardApplicationId: application.id,
        credentialTemplateId: credentialTemplate.id
      });
    });
  });

  return credentialsToIssue;
}

export type FindIssuableRewardCredentialsInput = {
  spaceId: string;
  applicationId?: string;
  rewardIds?: string[];
};

export async function findSpaceIssuableRewardCredentials({
  spaceId,
  applicationId,
  rewardIds
}: FindIssuableRewardCredentialsInput): Promise<IssuableRewardApplicationCredentialContent[]> {
  const space = await prisma.space.findUniqueOrThrow({
    where: { id: spaceId },
    select: {
      id: true,
      features: true,
      credentialTemplates: {
        where: {
          credentialEvents: {
            has: 'reward_submission_approved'
          }
        }
      }
    }
  });

  const rewardIdsList = !rewardIds ? undefined : typeof rewardIds === 'string' ? [rewardIds] : rewardIds;

  // Search by application ID, or reward IDs or rewards which have a page
  const query: Prisma.BountyWhereInput = applicationId
    ? { applications: { some: { id: applicationId } } }
    : rewardIdsList?.length
      ? { OR: [{ id: { in: rewardIdsList } }, { page: { id: { in: rewardIdsList } } }] }
      : {};

  const rewards = await prisma.bounty.findMany({
    where: query,
    select: {
      id: true,
      selectedCredentialTemplates: true,
      page: {
        select: {
          id: true
        }
      },
      applications: {
        where: { id: applicationId, status: { in: ['complete', 'processing', 'paid'] } },
        select: {
          id: true,
          createdBy: true,
          status: true,
          issuedCredentials: {
            select: { userId: true, credentialTemplateId: true, credentialEvent: true, onchainAttestationId: true }
          },
          applicant: {
            select: {
              id: true,
              primaryWallet: { select: { address: true } },
              wallets: { select: { address: true } }
            }
          }
        }
      }
    }
  });

  // Assuming a structure to find pending credentials for rewards similar to proposals
  const pendingSafeTransactions = await prisma.pendingSafeTransaction.findMany({
    where: {
      spaceId,
      rewardIds: { hasSome: rewards.map((r) => r.id) }
    },
    select: {
      credentialContent: true,
      rewardIds: true
    }
  });

  const pendingRewardsInSafe = pendingSafeTransactions.reduce(
    (acc, pendingTx) => {
      for (const rewardId of pendingTx.rewardIds) {
        const pendingRewardCredentials =
          (pendingTx as TypedPendingGnosisSafeTransaction<'reward'>).credentialContent?.[rewardId] ?? [];

        if (!acc[rewardId]) {
          acc[rewardId] = [];
        }

        acc[rewardId].push(...pendingRewardCredentials);
      }
      return acc;
    },
    {} as Record<string, PartialIssuableRewardApplicationCredentialContent[]>
  );

  return rewards
    .map((reward) =>
      generateCredentialInputsForReward({
        reward: reward as RewardWithJoinedData,
        space,
        // Assuming a similar structure for handling pending credentials
        // This will need to be adjusted based on how reward credentials are tracked and pending issuance is recorded
        pendingIssuableCredentials: pendingRewardsInSafe[reward.id]
      })
    )
    .flat();
}
