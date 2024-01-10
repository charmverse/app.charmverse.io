import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';

import { InvalidStateError } from 'lib/middleware';
import { getPageMetaList } from 'lib/pages/server/getPageMetaList';
import { permissionsApiClient } from 'lib/permissions/api/client';
import type { ProposalFields } from 'lib/proposal/interface';
import { createReward } from 'lib/rewards/createReward';
import { InvalidInputError } from 'lib/utilities/errors';
import { isTruthy } from 'lib/utilities/types';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishProposalEvent, publishProposalEventBase } from 'lib/webhookPublisher/publishEvent';
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
          id: true
        }
      },
      spaceId: true,
      archived: true,
      status: true,
      rewards: true,
      fields: true,
      reviewers: true,
      id: true
    }
  });

  const currentEvaluation = getCurrentEvaluation(proposal.evaluations);

  if (proposal.archived) {
    throw new InvalidStateError(`Archived proposals cannot be updated`);
  } else if (proposal.rewards?.length) {
    throw new InvalidStateError(`Rewards have already been created for this proposal`);
  }

  const permissions = await permissionsApiClient.proposals.computeProposalPermissions({
    resourceId: proposalId,
    userId
  });

  if (!permissions.evaluate && !permissions.review) {
    throw new InvalidStateError('Only reviewers can create rewards for a proposal');
  }

  const fields = proposal.fields as ProposalFields;
  const pendingRewards = fields?.pendingRewards;

  if (!pendingRewards || !pendingRewards.length) {
    throw new InvalidStateError('There are no pending rewards for this proposal');
  }

  let rewardsToCreate = [...pendingRewards];
  const rewardsPromises = rewardsToCreate.map(async ({ page, reward, draftId }) => {
    // create reward
    const { createdPageId } = await createReward({
      ...reward,
      pageProps: page || {},
      spaceId: proposal.spaceId,
      userId,
      proposalId
    });
    // filter out reward from pending rewards
    rewardsToCreate = rewardsToCreate.filter(({ draftId: d }) => d !== draftId);

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
      category: true,
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
