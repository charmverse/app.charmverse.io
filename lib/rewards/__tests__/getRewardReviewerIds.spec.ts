import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { generateBounty, generateRole } from '@packages/testing/setupDatabase';

import { getRewardReviewerIds } from '../getRewardReviewerIds';

describe('getRewardReviewerIds', () => {
  it('should be able to get all the ids of the bounty reviewers including those with role based permissions', async () => {
    const { user: bountyAuthor, space } = await testUtilsUser.generateUserAndSpace();
    const bountyReviewer1 = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    const bountyReviewer2 = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    const bountyApplicant = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const bountyReviewerRole = await generateRole({
      createdBy: bountyAuthor.id,
      spaceId: space.id,
      assigneeUserIds: [bountyReviewer2.id],
      roleName: 'Reviewer'
    });

    const bounty = await generateBounty({
      createdBy: bountyAuthor.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 100,
      rewardToken: 'ETH',
      bountyPermissions: {
        creator: [{ group: 'user', id: bountyAuthor.id }],
        reviewer: [
          { group: 'user', id: bountyReviewer1.id },
          {
            group: 'role',
            id: bountyReviewerRole.id
          }
        ]
      }
    });

    await prisma.application.create({
      data: {
        bountyId: bounty.id,
        message: 'I want to work on this bounty',
        createdBy: bountyApplicant.id,
        spaceId: space.id
      }
    });

    const bountyReviewerIds = await getRewardReviewerIds(bounty.id);
    expect(bountyReviewerIds.sort()).toStrictEqual([bountyReviewer1.id, bountyReviewer2.id].sort());
  });
});
