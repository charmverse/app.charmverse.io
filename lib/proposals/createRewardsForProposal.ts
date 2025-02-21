import type { TargetPermissionGroup } from '@charmverse/core/permissions';
import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { isTruthy } from '@packages/lib/utils/types';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { InvalidStateError } from '@packages/nextjs/errors';
import { InvalidInputError } from '@packages/utils/errors';
import { getPageMetaList } from '@root/lib/pages/server/getPageMetaList';
import type { ProposalFields } from '@root/lib/proposals/interfaces';
import type { RewardFields } from '@root/lib/rewards/blocks/interfaces';
import { createReward } from '@root/lib/rewards/createReward';
import { assignedWorkflow } from '@root/lib/rewards/getRewardWorkflows';
import { WebhookEventNames } from '@root/lib/webhookPublisher/interfaces';
import { publishProposalEventBase } from '@root/lib/webhookPublisher/publishEvent';
import { relay } from '@root/lib/websockets/relay';
import { uniqBy } from 'lodash';

import { permissionsApiClient } from '../permissions/api/client';

export async function createRewardsForProposal({ proposalId, userId }: { userId: string; proposalId: string }) {
  if (!proposalId) {
    throw new InvalidInputError('Please provide a valid proposalId');
  }

  const proposal = await prisma.proposal.findUniqueOrThrow({
    where: {
      id: proposalId
    },
    select: {
      evaluations: {
        select: {
          index: true,
          result: true,
          id: true,
          reviewers: true,
          finalStep: true,
          appealedAt: true
        },
        orderBy: {
          index: 'asc'
        }
      },
      spaceId: true,
      archived: true,
      status: true,
      rewards: true,
      fields: true,
      authors: true,
      reviewers: true,
      id: true
    }
  });

  const reviewers = proposal.evaluations.map((e) => e.reviewers.filter((r) => !r.systemRole)).flat();

  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);

  if (proposal.archived) {
    throw new InvalidStateError(`Archived proposals cannot be updated`);
  } else if (proposal.rewards?.length) {
    throw new InvalidStateError(`Rewards have already been created for this proposal`);
  }

  const fields = proposal.fields as ProposalFields;
  const pendingRewards = fields?.pendingRewards;

  if (!pendingRewards || !pendingRewards.length) {
    throw new InvalidStateError('There are no pending rewards for this proposal');
  }

  let rewardsToCreate = [...pendingRewards];
  const rewardsPromises = rewardsToCreate.map(async ({ page, reward, draftId }) => {
    // create reward
    const { createdPageId, reward: createdReward } = await createReward({
      ...reward,
      fields: {
        ...(reward.fields as RewardFields),
        workflowId: assignedWorkflow.id
      } as Prisma.JsonObject,
      reviewers: uniqBy(reviewers, (reviewer) => reviewer.userId || reviewer.roleId),
      allowedSubmitterRoles: [],
      pageProps: page || {},
      spaceId: proposal.spaceId,
      userId,
      proposalId,
      isPublic: (proposal.fields as ProposalFields).makeRewardsPublic
    });
    // filter out reward from pending rewards
    rewardsToCreate = rewardsToCreate.filter(({ draftId: d }) => d !== draftId);

    const createdPage = await prisma.page.findFirstOrThrow({
      where: {
        bountyId: createdReward.id
      },
      select: {
        id: true,
        createdBy: true,
        permissions: true
      }
    });

    const pagePermissionAssignees: TargetPermissionGroup[] = reviewers
      .map((reviewer) => {
        const assignee: TargetPermissionGroup | null = reviewer.userId
          ? { group: 'user', id: reviewer.userId }
          : reviewer.roleId
            ? { group: 'role', id: reviewer.roleId }
            : null;

        return assignee;
      })
      .filter(isTruthy);

    for (const author of proposal.authors) {
      pagePermissionAssignees.push({ group: 'user', id: author.userId });
    }

    // Add view permissions for reviewers
    await Promise.all(
      pagePermissionAssignees.map(async (assignee) =>
        permissionsApiClient.pages.upsertPagePermission({
          pageId: createdPage.id,
          permission: {
            assignee,
            permissionLevel: 'view'
          }
        })
      )
    );

    trackUserAction('bounty_created', {
      userId,
      spaceId: proposal.spaceId,
      resourceId: createdReward.id,
      rewardToken: createdReward.rewardToken,
      rewardAmount: createdReward.rewardAmount,
      pageId: createdPageId || '',
      customReward: createdReward.customReward
    });

    return createdPageId;
  });

  const createdPageIds = (await Promise.all(rewardsPromises)).filter(isTruthy);

  // keep a copy of the pending rewards that were published
  const updatedFields = { ...fields, pendingRewards: rewardsToCreate, pendingRewardsPublished: pendingRewards };

  const updatedProposal = await prisma.proposal.update({
    where: {
      id: proposalId
    },
    data: {
      fields: updatedFields
    },
    include: {
      authors: true,
      reviewers: true,
      rubricAnswers: true,
      rubricCriteria: {
        orderBy: {
          index: 'asc'
        }
      },
      rewards: true,
      form: {
        include: {
          formFields: {
            orderBy: {
              index: 'asc'
            }
          }
        }
      }
    }
  });

  const pages = await getPageMetaList(createdPageIds);
  relay.broadcast(
    {
      type: 'pages_created',
      payload: pages
    },
    proposal.spaceId
  );

  if (currentEvaluation) {
    await publishProposalEventBase({
      currentEvaluationId: currentEvaluation.id,
      proposalId: proposal.id,
      scope: WebhookEventNames.ProposalStatusChanged,
      spaceId: proposal.spaceId,
      userId
    });
  }

  return updatedProposal;
}
