
import { Space, User } from '@prisma/client';
import { createBounty } from 'lib/bounties';
import { assignRole } from 'lib/roles';
import { generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { prisma } from 'db';
import { v4 } from 'uuid';
import { DataNotFoundError } from 'lib/utilities/errors';
import { addBountyPermissionGroup } from 'lib/permissions/bounties';
import { listAvailableBounties } from '../listAvailableBounties';

let nonAdminUser: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  space = generated.space;

});

describe('listAvailableBounties', () => {

  it('should only return the bounties the user has an explicit permission for', async () => {

    // This will be used to create a bounty in a different space, and ensure we don't get bounties from that space
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const extraUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const bounties = await Promise.all([
      createBounty({
        createdBy: nonAdminUser.id,
        spaceId: space.id,
        title: 'Bounty by user'
      }),
      createBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty by other user'
      }),
      createBounty({
        createdBy: nonAdminUser.id,
        spaceId: space.id,
        title: 'Bounty by role'
      }),
      createBounty({
        createdBy: nonAdminUser.id,
        spaceId: space.id,
        title: 'Bounty by space you cant see'
      }),
      createBounty({
        createdBy: nonAdminUser.id,
        spaceId: space.id,
        title: 'Bounty by space'
      }),
      // User did not create this, so they should not see it
      createBounty({
        createdBy: nonAdminUser.id,
        spaceId: space.id,
        title: 'Bounty by space'
      })
    ]);

    const [bountyByUser, bountyByOtherUser, bountyByRole, bountyBySpace, bountyByPublic, invisibleBounty] = bounties;

    // 1/4 - Permission the user
    await addBountyPermissionGroup({
      level: 'viewer',
      resourceId: bountyByUser.id,
      assignee: {
        group: 'user',
        id: extraUser.id
      }
    });

    // 2/4 - Permission the role
    const role = await generateRole({
      spaceId: space.id,
      createdBy: nonAdminUser.id
    });

    await assignRole({
      roleId: role.id,
      userId: extraUser.id
    });

    await addBountyPermissionGroup({
      level: 'viewer',
      resourceId: bountyByRole.id,
      assignee: {
        group: 'role',
        id: role.id
      }
    });

    // 3/4 - Permission the space
    await addBountyPermissionGroup({
      level: 'viewer',
      resourceId: bountyBySpace.id,
      assignee: {
        group: 'space',
        id: space.id
      }
    });

    // 4/4 - Permission the public
    await addBountyPermissionGroup({
      level: 'viewer',
      resourceId: bountyByPublic.id,
      assignee: {
        group: 'public',
        id: undefined
      }
    });

    const available = await listAvailableBounties({
      spaceId: space.id,
      userId: extraUser.id
    });

    expect(available.length).toBe(4);

    // Cleanup bounties
    await prisma.bounty.deleteMany({
      where: {
        OR: bounties.map(b => {
          return { id: b.id };
        })
      }
    });
  });

  it('should always display the bounties the user created in the space', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);
    // No permissions provided
    const bounty = await createBounty({
      createdBy: otherUser.id,
      spaceId: otherSpace.id,
      title: 'Bounty by space'
    });

    // This one will be ignored
    await createBounty({
      createdBy: otherUser.id,
      spaceId: space.id,
      title: 'Bounty by space'
    });

    const bounties = await listAvailableBounties({
      spaceId: otherSpace.id,
      userId: otherUser.id
    });

    expect(bounties.length).toBe(1);
    expect(bounties[0].id).toBe(bounty.id);

  });

  it('should always display all space bounties to the admin, even if they have no permissions for this bounty', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);
    const adminUser = await generateSpaceUser({
      isAdmin: true,
      spaceId: otherSpace.id
    });

    // No permissions provided
    await createBounty({
      createdBy: otherUser.id,
      spaceId: otherSpace.id,
      title: 'Bounty by space'
    });

    // This one will be ignored
    await createBounty({
      createdBy: otherUser.id,
      spaceId: space.id,
      title: 'Bounty by space'
    });

    const bounties = await listAvailableBounties({
      spaceId: otherSpace.id,
      userId: adminUser.id
    });

    expect(bounties.length).toBe(1);

  });

  it('should display all space-accessible and public bounties to a non-logged in user, if the space has activated public bounty boards', async () => {
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
    const [publicBounty, spaceBounty, invisibleBounty] = await Promise.all([
      // A bounty which should show
      createBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for public',
        permissions: {
          viewer: [{
            group: 'public',
            id: undefined
          }]
        }
      }),
      // A bounty which space can work on, which should show
      createBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for space',
        permissions: {
          submitter: [{
            group: 'space',
            id: otherSpace.id
          }]
        }
      }),
      // A bounty accessible to a user only, which should not show
      createBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Invisible bounty',
        permissions: {
          creator: [{
            group: 'user',
            id: otherUser.id
          }]
        }
      })
    ]);

    const bounties = await listAvailableBounties({
      spaceId: otherSpace.id
    });

    expect(bounties.length).toBe(2);

    expect(bounties.every(b => b.id !== invisibleBounty.id)).toBe(true);
    expect(bounties.some(b => b.id === spaceBounty.id)).toBe(true);
    expect(bounties.some(b => b.id === publicBounty.id)).toBe(true);

  });

  it('should display all space-accessible and public bounties to a non-space member, if the space has activated public bounty boards', async () => {
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

    // No permissions provided
    const [publicBounty, spaceBounty, invisibleBounty] = await Promise.all([
      // A bounty which should show
      createBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for public',
        permissions: {
          viewer: [{
            group: 'public',
            id: undefined
          }]
        }
      }),
      // A bounty which space can work on, which should show
      createBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for space',
        permissions: {
          submitter: [{
            group: 'space',
            id: otherSpace.id
          }]
        }
      }),
      // A bounty accessible to a user only, which should not show
      createBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Invisible bounty',
        permissions: {
          creator: [{
            group: 'user',
            id: otherUser.id
          }]
        }
      })
    ]);

    const bounties = await listAvailableBounties({
      spaceId: otherSpace.id,
      userId: userInDifferentSpace.id
    });

    expect(bounties.length).toBe(2);

    expect(bounties.every(b => b.id !== invisibleBounty.id)).toBe(true);
    expect(bounties.some(b => b.id === spaceBounty.id)).toBe(true);
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
      createBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for public',
        permissions: {
          viewer: [{
            group: 'public',
            id: undefined
          }]
        }
      }),
      // A bounty which space can work on, which should show
      createBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for space',
        permissions: {
          submitter: [{
            group: 'space',
            id: otherSpace.id
          }]
        }
      }),
      // A bounty accessible to a user only, which should not show
      createBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Invisible bounty',
        permissions: {
          viewer: [{
            group: 'public',
            id: undefined
          }]
        }
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
      // A bounty which should show
      createBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for public',
        permissions: {
          viewer: [{
            group: 'public',
            id: undefined
          }]
        }
      }),
      // A bounty which space can work on, which should show
      createBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Bounty for space',
        permissions: {
          submitter: [{
            group: 'space',
            id: otherSpace.id
          }]
        }
      }),
      // A bounty accessible to a user only, which should not show
      createBounty({
        createdBy: otherUser.id,
        spaceId: otherSpace.id,
        title: 'Invisible bounty',
        permissions: {
          viewer: [{
            group: 'public',
            id: undefined
          }]
        }
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
});
