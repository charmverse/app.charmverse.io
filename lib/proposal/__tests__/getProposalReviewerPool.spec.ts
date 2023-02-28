import { addSpaceOperations } from 'lib/permissions/spaces';
import { generateRole, generateUserAndSpace } from 'testing/setupDatabase';

import { getProposalReviewerPool } from '../getProposalReviewerPool';

describe('getProposalReviewerPool', () => {
  it('should return space: true and empty list of roles if there is a space-wide reviewProposal permission', async () => {
    const { space } = await generateUserAndSpace({
      isAdmin: true
    });
    const role = await generateRole({
      createdBy: space.createdBy,
      spaceId: space.id
    });

    await addSpaceOperations({
      forSpaceId: space.id,
      spaceId: space.id,
      operations: ['reviewProposals']
    });

    const reviewerPool = await getProposalReviewerPool({
      spaceId: space.id
    });

    expect(reviewerPool.space).toBe(true);
    expect(reviewerPool.roles).toEqual([]);
  });

  it('should return space: false and subset of roles in the space which have reviewProposal permission', async () => {
    const { space } = await generateUserAndSpace({
      isAdmin: true
    });
    const role = await generateRole({
      createdBy: space.createdBy,
      spaceId: space.id
    });

    const secondRole = await generateRole({
      createdBy: space.createdBy,
      spaceId: space.id
    });

    await addSpaceOperations({
      forSpaceId: space.id,
      roleId: role.id,
      operations: ['reviewProposals']
    });

    const reviewerPool = await getProposalReviewerPool({
      spaceId: space.id
    });

    expect(reviewerPool.space).toBe(false);
    expect(reviewerPool.roles).toEqual([role.id]);
  });
});
