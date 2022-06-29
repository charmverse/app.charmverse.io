
import { DataNotFoundError } from 'lib/utilities/errors';
import { generateBounty, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { flatArrayMap } from 'lib/utilities/array';
import { Bounty, BountyPermission, BountyPermissionLevel, Space, User } from '@prisma/client';
import { prisma } from 'db';
import { addBountyPermissionGroup } from '../addBountyPermissionGroup';
import { queryBountyPermissions } from '../queryBountyPermissions';
import { setBountyPermissions } from '../setBountyPermissions';
import { BountyPermissionAssignment, BulkBountyPermissionAssignment } from '../interfaces';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  space = generated.space;
  user = generated.user;
});

describe('setBountyPermissions', () => {

  it('should set the bounty permissions to match selected ones, deleting any outdated permissions', async () => {

    const bounty = await generateBounty({
      createdBy: user.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    await Promise.all([
      addBountyPermissionGroup({
        resourceId: bounty.id,
        level: 'reviewer',
        assignee: {
          group: 'user',
          id: user.id
        }
      }),
      addBountyPermissionGroup({
        resourceId: bounty.id,
        level: 'submitter',
        assignee: {
          group: 'space',
          id: space.id
        }
      })
    ]);

    await setBountyPermissions({
      bountyId: bounty.id,
      // Only 1 permission should exist
      permissionsToAssign: [
        {
          level: 'viewer',
          assignee: {
            group: 'user',
            id: user.id
          }
        }
      ]
    });

    const queryResult = await queryBountyPermissions({
      bountyId: bounty.id
    });

    expect(queryResult.viewer.some(p => p.group === 'user' && p.id === user.id)).toBe(true);

  });

  it('should accept bounty permissions as an input too', async () => {

    const bounty = await generateBounty({
      createdBy: user.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    await setBountyPermissions({
      bountyId: bounty.id,
      // Only 1 permission should exist
      permissionsToAssign: {
        viewer: [{
          group: 'space',
          id: space.id
        }]
      }
    });

    const queryResult = await queryBountyPermissions({
      bountyId: bounty.id
    });

    expect(queryResult.viewer.some(p => p.group === 'space' && p.id === space.id)).toBe(true);

  });

  it('should not recreate existing permissions, only adding missing ones', async () => {

    const extraUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const permissionLevel: BountyPermissionLevel = 'viewer';

    const bounty = await generateBounty({
      createdBy: user.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    const assignment: BountyPermissionAssignment = {
      resourceId: bounty.id,
      level: permissionLevel,
      assignee: {
        group: 'user',
        id: extraUser.id
      }
    };

    const bulkAssignment: BulkBountyPermissionAssignment = {
      bountyId: bounty.id,
      // Only 1 permission should exist
      permissionsToAssign: [
        assignment
      ]
    };

    await setBountyPermissions(bulkAssignment);

    const afterFirst = await prisma.bountyPermission.findFirst({
      where: {
        permissionLevel,
        bountyId: bounty.id,
        userId: extraUser.id

      }
    }) as BountyPermission;

    await setBountyPermissions(bulkAssignment);

    const afterSecond = await prisma.bountyPermission.findFirst({
      where: {
        permissionLevel,
        bountyId: bounty.id,
        userId: extraUser.id

      }
    }) as BountyPermission;

    expect(typeof afterFirst.id === 'string').toBe(true);
    expect(afterFirst.id).toBe(afterSecond.id);

  });

  it('should fail if the bounty does not exist', async () => {

    const randomId = v4();

    await expect(setBountyPermissions({
      bountyId: randomId,
      // Only 1 permission should exist
      permissionsToAssign: [
        {
          level: 'viewer',
          assignee: {
            group: 'user',
            id: user.id
          }
        }
      ]
    })).rejects.toBeInstanceOf(DataNotFoundError);

  });

});
