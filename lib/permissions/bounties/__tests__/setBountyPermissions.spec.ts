import type { Role, Space, User } from '@charmverse/core/dist/prisma';
import { v4 } from 'uuid';

import { DataNotFoundError } from 'lib/utilities/errors';
import {
  generateBounty,
  generateRole,
  generateSpaceUser,
  generateUserAndSpaceWithApiToken
} from 'testing/setupDatabase';

import { addBountyPermissionGroup } from '../addBountyPermissionGroup';
import { queryBountyPermissions } from '../queryBountyPermissions';
import { setBountyPermissions } from '../setBountyPermissions';

let user: User;
let reviewerUser: User;
let space: Space;
let role: Role;
let secondRole: Role;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;
  reviewerUser = await generateSpaceUser({
    isAdmin: false,
    spaceId: space.id
  });
  role = await generateRole({
    createdBy: user.id,
    spaceId: space.id
  });
  secondRole = await generateRole({
    createdBy: user.id,
    spaceId: space.id
  });
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
        level: 'submitter',
        assignee: {
          group: 'space',
          id: space.id
        }
      }),
      addBountyPermissionGroup({
        resourceId: bounty.id,
        level: 'reviewer',
        assignee: {
          group: 'role',
          id: role.id
        }
      }),
      addBountyPermissionGroup({
        resourceId: bounty.id,
        level: 'reviewer',
        assignee: {
          group: 'role',
          id: secondRole.id
        }
      }),
      addBountyPermissionGroup({
        resourceId: bounty.id,
        level: 'reviewer',
        assignee: {
          group: 'user',
          id: reviewerUser.id
        }
      })
    ]);

    await setBountyPermissions({
      bountyId: bounty.id,
      // Only 1 permission should exist
      permissionsToAssign: [
        {
          level: 'submitter',
          assignee: {
            group: 'space',
            id: space.id
          }
        },
        {
          level: 'reviewer',
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

    expect(queryResult.reviewer.some((p) => p.group === 'user' && p.id === user.id)).toBe(true);
    expect(queryResult.reviewer.length === 1).toBe(true);
    expect(queryResult.submitter.length === 1).toBe(true);
  });

  it('should insert a default space permission if submitters are empty', async () => {
    const bounty = await generateBounty({
      createdBy: user.id,
      approveSubmitters: true,
      spaceId: space.id,
      status: 'open'
    });

    await Promise.all([
      addBountyPermissionGroup({
        resourceId: bounty.id,
        level: 'submitter',
        assignee: {
          group: 'space',
          id: space.id
        }
      }),
      addBountyPermissionGroup({
        resourceId: bounty.id,
        level: 'reviewer',
        assignee: {
          group: 'role',
          id: role.id
        }
      }),
      addBountyPermissionGroup({
        resourceId: bounty.id,
        level: 'reviewer',
        assignee: {
          group: 'role',
          id: secondRole.id
        }
      }),
      addBountyPermissionGroup({
        resourceId: bounty.id,
        level: 'reviewer',
        assignee: {
          group: 'user',
          id: reviewerUser.id
        }
      })
    ]);

    await setBountyPermissions({
      bountyId: bounty.id,
      // Only 1 permission should exist
      permissionsToAssign: [
        {
          level: 'reviewer',
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

    expect(queryResult.reviewer.some((p) => p.group === 'user' && p.id === user.id)).toBe(true);
    expect(queryResult.reviewer.length === 1).toBe(true);
    expect(queryResult.submitter.length === 1).toBe(true);
    expect(queryResult.submitter.some((p) => p.group === 'space' && p.id === space.id)).toBe(true);
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
        reviewer: [
          {
            group: 'space',
            id: space.id
          }
        ]
      }
    });

    const queryResult = await queryBountyPermissions({
      bountyId: bounty.id
    });

    expect(queryResult.reviewer.some((p) => p.group === 'space' && p.id === space.id)).toBe(true);
  });

  it('should fail if the bounty does not exist', async () => {
    const randomId = v4();

    await expect(
      setBountyPermissions({
        bountyId: randomId,
        // Only 1 permission should exist
        permissionsToAssign: [
          {
            level: 'reviewer',
            assignee: {
              group: 'user',
              id: user.id
            }
          }
        ]
      })
    ).rejects.toBeInstanceOf(DataNotFoundError);
  });
});
