import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { uniqBy } from 'lodash';

import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { InvalidStateError } from 'lib/middleware';
import { getPageMetaList } from 'lib/pages/server/getPageMetaList';
import type { ProposalFields } from 'lib/proposals/interfaces';
import type { RewardFields } from 'lib/rewards/blocks/interfaces';
import { createReward } from 'lib/rewards/createReward';
import { assignedWorkflow } from 'lib/rewards/getRewardWorkflows';
import type { RewardReviewer } from 'lib/rewards/interfaces';
import { InvalidInputError } from 'lib/utils/errors';
import { isTruthy } from 'lib/utils/types';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishProposalEventBase } from 'lib/webhookPublisher/publishEvent';
import { relay } from 'lib/websockets/relay';

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
          finalStep: true
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
      reviewers: uniqBy(
        reviewers
          .map((reviewer) =>
            reviewer.roleId
              ? { group: 'role', id: reviewer.roleId }
              : reviewer.userId
              ? { group: 'user', id: reviewer.userId }
              : null
          )
          .filter(isTruthy) as RewardReviewer[],
        'id'
      ),
      allowedSubmitterRoles: [],
      pageProps: page || {},
      spaceId: proposal.spaceId,
      userId,
      proposalId
    });
    // filter out reward from pending rewards
    rewardsToCreate = rewardsToCreate.filter(({ draftId: d }) => d !== draftId);

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

  const updatedFields = { ...fields, pendingRewards: rewardsToCreate };

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
