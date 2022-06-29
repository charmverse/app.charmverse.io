
import { Space, User } from '@prisma/client';
import { createBounty } from 'lib/bounties';
import { assignRole } from 'lib/roles';
import { generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { prisma } from 'db';
import { addBountyPermissionGroup } from '../../permissions/bounties';
import { listAvailableBounties } from '../listAvailableBounties';

let nonAdminUser: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(undefined, false);

  nonAdminUser = generated.user;
  space = generated.space;

});

describe('listAvailableBounties', () => {
  it('should only return the bounties the user has access to', async () => {

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
      })
    ]);

    const [bountyByUser, bountyByOtherUser, bountyByRole, bountyBySpace, bountyByPublic] = bounties;

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

});
