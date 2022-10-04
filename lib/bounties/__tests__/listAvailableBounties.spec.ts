
import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { assignRole } from 'lib/roles';
import { DataNotFoundError } from 'lib/utilities/errors';
import { generateBounty, generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { listAvailableBounties } from '../listAvailableBounties';

let nonAdminUser: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  space = generated.space;

});

// We only rely on page permissions to determine if a user can view a bounty
describe('listAvailableBounties', () => {

  it('should return the bounties where a user has access to the underlying page', async () => {

    // This will be used to create a bounty in a different space, and ensure we don't get bounties from that space
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const extraUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const role = await generateRole({
      spaceId: space.id,
      createdBy: nonAdminUser.id
    });

    await assignRole({
      roleId: role.id,
      userId: extraUser.id
    });

    // We are explicitly initialising the bounty with no bounty permissions
    const [
      bountyWithUserPermission,
      bountyWithRolePermission,
      bountyWithSpacePermission,
      bountyWithPublicPermission,
      bountyByOtherUser,
      bountyInOtherSpace
    ] = await Promise.all([
      generateBounty({
        createdBy: nonAdminUser.id,
        spaceId: space.id,
        title: 'Bounty with user permission as user created it',
        status: 'open',
        rewardAmount: 1,
        rewardToken: 'ETH',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          userId: extraUser.id
        }]
      }),
      generateBounty({
        createdBy: nonAdminUser.id,
        spaceId: space.id,
        title: 'Bounty with role permission',
        status: 'open',
        rewardAmount: 1,
        rewardToken: 'ETH',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          roleId: role.id
        }]
      }),
      generateBounty({
        createdBy: nonAdminUser.id,
        spaceId: space.id,
        title: 'Bounty with space permission',
        status: 'open',
        rewardAmount: 1,
        rewardToken: 'ETH',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          spaceId: space.id
        }]
      }),
      generateBounty({
        createdBy: nonAdminUser.id,
        spaceId: space.id,
        title: 'Bounty with public permission',
        status: 'open',
        rewardAmount: 1,
        rewardToken: 'ETH',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          public: true
        }]
      }),
      // -------- Invisible bounties -------
      // Bounty in current space but no permissions created
      generateBounty({
        createdBy: nonAdminUser.id,
        spaceId: space.id,
        title: 'Bounty by other space user',
        status: 'open',
        rewardAmount: 1,
        rewardToken: 'ETH',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: []
      }),
      // Bounty in different space we shouldn't see
      generateBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty in other space',
        status: 'open',
        rewardAmount: 1,
        rewardToken: 'ETH',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          spaceId: otherSpace.id
        }]
      })
    ]);

    const available = await listAvailableBounties({
      spaceId: space.id,
      userId: extraUser.id
    });

    expect(available.length).toBe(4);

    // Check for created bounties
    expect(available.some(b => b.id === bountyWithUserPermission.id)).toBe(true);
    expect(available.some(b => b.id === bountyWithRolePermission.id)).toBe(true);
    expect(available.some(b => b.id === bountyWithSpacePermission.id)).toBe(true);
    expect(available.some(b => b.id === bountyWithPublicPermission.id)).toBe(true);

    // Make sure these are missing
    expect(available.every(b => b.id !== bountyInOtherSpace.id)).toBe(true);
    expect(available.every(b => b.id !== bountyByOtherUser.id)).toBe(true);
  });

  it('should not show the bounty to the creating the user if they do not have the corresponding page permission', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);
    // No permissions provided
    const bounty = await generateBounty({
      createdBy: otherUser.id,
      spaceId: otherSpace.id,
      title: 'Bounty by space',
      status: 'open',
      rewardAmount: 1,
      rewardToken: 'ETH',
      approveSubmitters: false,
      bountyPermissions: {},
      pagePermissions: []
    });

    const bounties = await listAvailableBounties({
      spaceId: otherSpace.id,
      userId: otherUser.id
    });

    expect(bounties.length).toBe(0);

  });

  it('should always display all space bounties to the admin, even if they have no permissions for this bounty', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);
    const adminUser = await generateSpaceUser({
      isAdmin: true,
      spaceId: otherSpace.id
    });

    // No permissions provided
    await generateBounty({
      createdBy: otherUser.id,
      spaceId: otherSpace.id,
      title: 'Bounty by space',
      status: 'open',
      rewardAmount: 1,
      rewardToken: 'ETH',
      approveSubmitters: false,
      bountyPermissions: {},
      pagePermissions: []
    });

    // This one will be ignored as it is in a separate space
    await generateBounty({
      createdBy: nonAdminUser.id,
      spaceId: space.id,
      title: 'Bounty by space',
      status: 'open',
      rewardAmount: 1,
      rewardToken: 'ETH',
      approveSubmitters: false,
      bountyPermissions: {},
      pagePermissions: [{
        permissionLevel: 'view',
        spaceId: space.id
      }]
    });

    const bounties = await listAvailableBounties({
      spaceId: otherSpace.id,
      userId: adminUser.id
    });

    expect(bounties.length).toBe(1);

  });

  it('should display all public bounties to a non-logged in user, if the space has activated public bounty boards', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    await prisma.space.update({
      where: {
        id: otherSpace.id
      },
      data: {
        publicBountyBoard: true
      }
    });

    // eslint-disable-next-line prefer-const
    let [publicBounty, spaceBounty, invisibleBounty] = await Promise.all([
      // A bounty which should show
      generateBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for public',
        status: 'open',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          public: true
        }]
      }),
      // A bounty which space can work on, which should show
      generateBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for space',
        status: 'open',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          spaceId: otherSpace.id
        }]
      }),
      // A bounty accessible to a user only, which should not show
      generateBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Invisible bounty',
        status: 'open',
        rewardAmount: 1,
        rewardToken: 'ETH',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          userId: otherUser.id
        }]
      })
    ]);

    const bounties = await listAvailableBounties({
      spaceId: otherSpace.id
    });

    expect(bounties.length).toBe(1);

    expect(bounties.every(b => b.id !== invisibleBounty.id)).toBe(true);
    expect(bounties.every(b => b.id !== spaceBounty.id)).toBe(true);
    expect(bounties.some(b => b.id === publicBounty.id)).toBe(true);

  });

  it('should display all public bounties to a non-space member, if the space has activated public bounty boards', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);
    const { user: userInDifferentSpace } = await generateUserAndSpaceWithApiToken(undefined, false);

    await prisma.space.update({
      where: {
        id: otherSpace.id
      },
      data: {
        publicBountyBoard: true
      }
    });

    const [publicBounty, spaceBounty, invisibleBounty] = await Promise.all([
      // A bounty which should show
      generateBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for public',
        status: 'open',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          public: true
        }]
      }),
      generateBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for public',
        status: 'open',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          spaceId: otherSpace.id
        }]
      }),
      // A bounty accessible to a user only, which should not show
      generateBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Invisible bounty',
        status: 'open',
        rewardAmount: 1,
        rewardToken: 'ETH',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          userId: otherUser.id
        }]
      })
    ]);

    const bounties = await listAvailableBounties({
      spaceId: otherSpace.id,
      userId: userInDifferentSpace.id
    });

    expect(bounties.length).toBe(1);

    expect(bounties.every(b => b.id !== invisibleBounty.id)).toBe(true);
    expect(bounties.every(b => b.id !== spaceBounty.id)).toBe(true);
    expect(bounties.some(b => b.id === publicBounty.id)).toBe(true);

  });

  it('should return an empty list for to a non-logged in user, if the space has not activated public bounty boards', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    await prisma.space.update({
      where: {
        id: otherSpace.id
      },
      data: {
        publicBountyBoard: false
      }
    });

    // No permissions provided
    const [publicBounty, spaceBounty, invisibleBounty] = await Promise.all([
      // A bounty which should show
      generateBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for public',
        status: 'open',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          public: true
        }]
      }),
      // A bounty which space can work on, which should show
      generateBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for space',
        status: 'open',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          spaceId: otherSpace.id
        }]
      }),
      // A bounty accessible to a user only, which should not show
      generateBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Invisible bounty',
        status: 'open',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          userId: otherUser.id
        }]
      })
    ]);

    const bounties = await listAvailableBounties({
      spaceId: otherSpace.id
    });

    expect(bounties.length).toBe(0);
  });

  it('should return an empty list for to a non space member, if the space has not activated public bounty boards', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);
    const { user: userInDifferentSpace } = await generateUserAndSpaceWithApiToken(undefined, false);

    await prisma.space.update({
      where: {
        id: otherSpace.id
      },
      data: {
        publicBountyBoard: false
      }
    });

    // No permissions provided
    const [publicBounty, spaceBounty, invisibleBounty] = await Promise.all([
      // A bounty which would show if the space had activated public bounty boards
      generateBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for public',
        status: 'open',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          public: true
        }]
      }),
      // A bounty which would show if the space had activated public bounty boards
      generateBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for space',
        status: 'open',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          spaceId: otherSpace.id
        }]
      }),
      // A bounty accessible to a user only, which should never show
      generateBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Invisible bounty',
        status: 'open',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          userId: otherUser.id
        }]
      })
    ]);

    const bounties = await listAvailableBounties({
      spaceId: otherSpace.id,
      userId: userInDifferentSpace.id
    });

    expect(bounties.length).toBe(0);

  });

  it('should fail if the space does not exist', async () => {
    await expect(listAvailableBounties({
      spaceId: v4()
    })).rejects.toBeInstanceOf(DataNotFoundError);
  });

  it('should ignore bounties whose linked page has been deleted', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    await prisma.space.update({
      where: {
        id: otherSpace.id
      },
      data: {
        publicBountyBoard: true
      }
    });

    // No permissions provided
    const [publicBountyDeleted, spaceBountyDeleted, spaceBountyThatShows] = await Promise.all([
      // A bounty which would show if the page were not deleted
      generateBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for public',
        status: 'open',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          public: true
        }],
        page: {
          deletedAt: new Date()
        }
      }),
      // A bounty which would show if the page were not deleted
      generateBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for space',
        status: 'open',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          spaceId: otherSpace.id
        }],
        page: {
          deletedAt: new Date()
        }
      }),
      // A normal space-accessible bounty which should show
      generateBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for space',
        status: 'open',
        approveSubmitters: false,
        bountyPermissions: {},
        pagePermissions: [{
          permissionLevel: 'view',
          spaceId: otherSpace.id
        }]
      })
    ]);

    const spaceMemberBounties = await listAvailableBounties({
      spaceId: otherSpace.id,
      userId: otherUser.id
    });

    const publicBounties = await listAvailableBounties({
      spaceId: otherSpace.id,
      userId: otherUser.id
    });

    [spaceMemberBounties, publicBounties].forEach(list => {
      expect(list.length).toBe(1);
      expect(list[0].id).toBe(spaceBountyThatShows.id);
    });
  });

  it('should fail if the space does not exist', async () => {
    await expect(listAvailableBounties({
      spaceId: v4()
    })).rejects.toBeInstanceOf(DataNotFoundError);
  });
});
