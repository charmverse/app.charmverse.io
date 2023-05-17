import type { ProposalReviewerPool } from '@charmverse/core';
import { ProposalNotFoundError, generateSpaceUser } from '@charmverse/core';
import { v4 } from 'uuid';

import { generateRole, generateUserAndSpace } from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

import { getProposalReviewerPool } from '../getProposalReviewerPool';

describe('getProposalReviewerPool', () => {
  it('should return the list of all user IDs in the space and no roles', async () => {
    const { space, user } = await generateUserAndSpace({});

    const extraUser = await generateSpaceUser({
      spaceId: space.id
    });

    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id
    });

    const category = await generateProposalCategory({
      spaceId: space.id
    });

    const proposal = await generateProposal({
      categoryId: category.id,
      spaceId: space.id,
      userId: user.id
    });

    const reviewerPool: ProposalReviewerPool = await getProposalReviewerPool({
      resourceId: proposal.id
    });

    expect(reviewerPool.userIds).toEqual(expect.arrayContaining([user.id, extraUser.id]));
    expect(reviewerPool.roleIds).toEqual([]);
  });

  it('should throw an error if the proposal does not exist', async () => {
    const id = v4();
    await expect(getProposalReviewerPool({ resourceId: id })).rejects.toMatchObject(new ProposalNotFoundError(id));
  });
});
