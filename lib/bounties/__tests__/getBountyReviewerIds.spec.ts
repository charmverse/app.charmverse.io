import { createApplication } from 'lib/applications/actions';
import { createBounty } from 'lib/bounties';
import { generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { getBountyReviewerIds } from '../getBountyReviewerIds';

describe('getBountyReviewerIds', () => {
  it('should be able to get all the ids of the bounty reviewers including those with role based permissions', async () => {
    const generated = await generateUserAndSpaceWithApiToken(undefined, true);
    const { user: bountyAuthor, space } = generated;
    const bountyReviewer1 = await generateSpaceUser({ spaceId: space.id });
    const bountyReviewer2 = await generateSpaceUser({ spaceId: space.id });
    const bountyApplicant = await generateSpaceUser({ spaceId: space.id });

    const bountyReviewerRole = await generateRole({
      createdBy: bountyAuthor.id,
      spaceId: space.id,
      assigneeUserIds: [bountyReviewer2.id],
      roleName: 'Reviewer'
    });

    const bounty = await createBounty({
      createdBy: bountyAuthor.id,
      spaceId: space.id,
      status: 'open',
      rewardAmount: 100,
      rewardToken: 'ETH',
      permissions: {
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

    await createApplication({
      bountyId: bounty.id,
      message: 'I want to work on this bounty',
      userId: bountyApplicant.id
    });

    const bountyReviewerIds = await getBountyReviewerIds(bounty.id);
    expect(bountyReviewerIds.sort()).toStrictEqual([bountyReviewer1.id, bountyReviewer2.id].sort());
  });
});
