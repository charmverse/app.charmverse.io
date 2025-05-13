import { testUtilsBounties, testUtilsUser } from '@charmverse/core/test';

import { listAvailableRewards } from '../listAvailableRewards';

// We only rely on page permissions to determine if a user can view a bounty
describe('listAvailableRewards', () => {
  it('should return all rewards in the space', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const nonAdminUser = await testUtilsUser.generateSpaceUser({ isAdmin: false, spaceId: space.id });

    const bounty = await testUtilsBounties.generateBounty({
      approveSubmitters: false,
      createdBy: nonAdminUser.id,
      spaceId: space.id,
      status: 'open'
    });

    // This will be used to create a bounty in a different space, and ensure we don't get bounties from that space
    const { space: otherSpace, user: otherUser } = await testUtilsUser.generateUserAndSpace({ isAdmin: false });

    const bountyInOtherSpace = await testUtilsBounties.generateBounty({
      approveSubmitters: false,
      createdBy: otherUser.id,
      spaceId: otherSpace.id,
      status: 'open'
    });

    const availableForAdmin = await listAvailableRewards({
      spaceId: space.id,
      userId: adminUser.id
    });

    const availableForMember = await listAvailableRewards({
      spaceId: space.id,
      userId: nonAdminUser.id
    });

    const availableForPublic = await listAvailableRewards({
      spaceId: space.id,
      userId: undefined
    });

    [availableForAdmin, availableForMember, availableForPublic].forEach((bountyList) => {
      expect(bountyList.length).toBe(1);
      expect(bountyList[0].id).toBe(bounty.id);
    });
  });

  it('should exclude deleted bounties from the results', async () => {
    const { user: adminUser, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const deletedBounty = await testUtilsBounties.generateBounty({
      page: {
        deletedAt: new Date()
      },
      approveSubmitters: false,
      createdBy: adminUser.id,
      spaceId: space.id,
      status: 'open'
    });

    const result = await listAvailableRewards({
      spaceId: space.id,
      userId: adminUser.id
    });

    expect(result.length).toBe(0);
  });
});
