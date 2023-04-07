import type { Space, User } from '@prisma/client';

import { DataNotFoundError } from 'lib/utilities/errors';
import { createPage, generateBounty, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { lockToBountyCreator } from '../lockToBountyCreator';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('lockToBountyCreator', () => {
  it('should update the permissions to view-only for the space, and full access for the creator', async () => {
    const submitterUser = await generateSpaceUser({
      isAdmin: false,
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
        {
          permissionLevel: 'editor',
          userId: user.id
        },
        {
          permissionLevel: 'editor',
          spaceId: space.id
        },
        {
          permissionLevel: 'editor',
          userId: submitterUser.id
        }
      ]
    });

    const { permissions } = await lockToBountyCreator({ pageId: bounty.page.id });

    expect(permissions.length).toBe(2);
    expect(permissions.some((p) => p.userId === user.id && p.permissionLevel === 'full_access'));
    expect(permissions.some((p) => p.spaceId === space.id && p.permissionLevel === 'view'));
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
