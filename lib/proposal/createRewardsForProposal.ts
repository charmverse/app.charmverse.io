import { prisma } from '@charmverse/core/prisma-client';

import { InvalidStateError } from 'lib/middleware';
import { getPermissionsClient } from 'lib/permissions/api';
import type { ProposalFields } from 'lib/proposal/blocks/interfaces';
import { createReward } from 'lib/rewards/createReward';
import { InvalidInputError } from 'lib/utilities/errors';

import { ProposalNotFoundError } from './errors';

export async function createRewardsForProposal({ proposalId, userId }: { userId: string; proposalId: string }) {
  if (!proposalId) {
    throw new InvalidInputError('Please provide a valid proposalId');
  }

  const proposal = await prisma.proposal.findUnique({
    where: {
      id: proposalId
    },
    select: {
      spaceId: true,
      archived: true,
      status: true,
      rewards: true,
      fields: true
    }
  });

  if (!proposal) {
    throw new ProposalNotFoundError(proposalId);
  } else if (proposal.archived) {
    throw new InvalidStateError(`Archived proposals cannot be updated`);
  } else if (proposal.rewards?.length) {
    throw new InvalidStateError(`Rewards have already been created for this proposal`);
  }

  const permissions = await getPermissionsClient({ resourceId: proposalId, resourceIdType: 'proposal' }).then(
    ({ client }) =>
      client.proposals.computeProposalPermissions({
        resourceId: proposalId,
        userId
      })
  );

  // if (!permissions.review) {
  //   throw new InvalidStateError('You do not have permission to create rewards for this proposal');
  // }

  const fields = proposal.fields as ProposalFields;
  const pendingRewards = fields.pendingRewards;

  if (!pendingRewards || !pendingRewards.length) {
    throw new InvalidStateError('There are no pending rewards for this proposal');
  }

  let rewardsToCreate = [...pendingRewards];
  const rewardsPromises = rewardsToCreate.map(async ({ page, reward, draftId }) => {
    // create reward
    await createReward({
      ...reward,
      pageProps: page || {},
      spaceId: proposal.spaceId,
      userId,
      proposalId
    });
    // filter out reward from pending rewards
    rewardsToCreate = rewardsToCreate.filter(({ draftId: d }) => d !== draftId);
  });

  await Promise.all(rewardsPromises);

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
      rewards: true
    }
  });

  return updatedProposal;
}
