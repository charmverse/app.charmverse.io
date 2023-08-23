import { DataNotFoundError } from '@charmverse/core/errors';
import type { ProposalReviewerPool } from '@charmverse/core/permissions';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { getProposalReviewerPool } from '../getProposalReviewerPool';

describe('getProposalReviewerPool', () => {
  it('should return the list of all user IDs in the space and no roles', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({});

    const extraUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const role = await testUtilsMembers.generateRole({
      spaceId: space.id,
      createdBy: user.id
    });

    const category = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    const proposal = await testUtilsProposals.generateProposal({
      categoryId: category.id,
      spaceId: space.id,
      userId: user.id
    });

    const reviewerPool: ProposalReviewerPool = await getProposalReviewerPool({
      resourceId: proposal.categoryId as string
    });

    expect(reviewerPool.userIds).toEqual(expect.arrayContaining([user.id, extraUser.id]));
    expect(reviewerPool.roleIds).toEqual([]);
  });

  it('should throw an error if the proposal does not exist', async () => {
    const id = v4();
    await expect(getProposalReviewerPool({ resourceId: id })).rejects.toBeInstanceOf(DataNotFoundError);
  });
});
