import type { Space, User } from '@prisma/client';

import { DataNotFoundError } from 'lib/utilities/errors';
import {
  createPage,
  generateBounty,
  generateRole,
  generateSpaceUser,
  generateUserAndSpaceWithApiToken
} from 'testing/setupDatabase';

import { lockToBountyCreator } from '../lockToBountyCreator';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('lockToBountyCreator', () => {
  it('should update editor and above permissions to view-only, and always include full access for the creator, leaving other permissions unchanged', async () => {
    const submitterUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const role = await generateRole({
      createdBy: user.id,
      spaceId: space.id
    });

    const bounty = await generateBounty({
      createdBy: user.id,
      spaceId: space.id,
      approveSubmitters: false,
      status: 'open',
      chainId: 1,
      rewardToken: 'ETH',
      bountyPermissions: {
        creator: [
          {
            group: 'user',
            id: user.id
          }
        ],
        submitter: [
          {
            group: 'space',
            id: space.id
          }
        ]
      },
      pagePermissions: [
        // Should remain the same
        // // This permission below should be inserted
        // {
        //   permissionLevel: 'full_access',
        //   userId: user.id
        // },
        {
          permissionLevel: 'view_comment',
          roleId: role.id
        },
        // Should be locked down
        {
          permissionLevel: 'editor',
          userId: submitterUser.id
        },
        {
          permissionLevel: 'editor',
          spaceId: space.id
        }
      ]
    });

    const { permissions } = await lockToBountyCreator({ pageId: bounty.page.id });

    expect(permissions.length).toBe(4);
    // Unchanged
    expect(permissions.some((p) => p.roleId === role.id && p.permissionLevel === 'view_comment'));
    // Auto-set
    expect(permissions.some((p) => p.userId === user.id && p.permissionLevel === 'full_access'));
    // Locked down
    expect(permissions.some((p) => p.spaceId === space.id && p.permissionLevel === 'view'));
    expect(permissions.some((p) => p.userId === submitterUser.id && p.permissionLevel === 'view'));
  });

  it('should throw an error if targeting a page without a bounty', async () => {
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      type: 'page'
    });

    await expect(lockToBountyCreator({ pageId: page.id })).rejects.toBeInstanceOf(DataNotFoundError);
  });
});
