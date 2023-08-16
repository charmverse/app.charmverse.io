import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';

import { getAllReviewerUserIds } from '../getAllReviewerIds';

describe('getAllReviewerUserIds', () => {
  it('should return all ids for users reviewing the proposal, and those who can review it via their role', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace();
    const reviewerUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
    const reviewerUserByRole = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const reviewerAsIndividualAndByRole = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    // Should be excluded
    const normalSpaceMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const reviewerRole = await testUtilsMembers.generateRole({
      spaceId: space.id,
      createdBy: user.id,
      assigneeUserIds: [reviewerUserByRole.id, reviewerAsIndividualAndByRole.id]
    });

    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      reviewers: [
        {
          group: 'user',
          id: reviewerUser.id
        },
        {
          group: 'user',
          id: reviewerAsIndividualAndByRole.id
        },
        {
          group: 'role',
          id: reviewerRole.id
        }
      ]
    });

    const reviewerIds = await getAllReviewerUserIds({
      proposalId: proposal.id
    });

    expect(reviewerIds.length).toEqual(3);
    expect(reviewerIds).toContain(reviewerUser.id);
    expect(reviewerIds).toContain(reviewerUserByRole.id);
    // Make sure we ran a deduplication and this user is only included once
    expect(reviewerIds).toContain(reviewerAsIndividualAndByRole.id);
  });
});
