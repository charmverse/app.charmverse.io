import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser, testUtilsMembers, testUtilsPages, testUtilsBounties } from '@charmverse/core/test';
import { DataNotFoundError } from '@packages/core/errors';

import { lockPagePermissionsToBountyCreator } from '../lockPagePermissionsToBountyCreator';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace();
  user = generated.user;
  space = generated.space;
});

describe('lockPagePermissionsToBountyCreator', () => {
  it('should update editor and above permissions to view-only, and always include full access for the creator, leaving other permissions unchanged', async () => {
    const submitterUser = await testUtilsUser.generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const role = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id
    });

    const bounty = await testUtilsBounties.generateBounty({
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
          assignee: { group: 'role', id: role.id }
        },
        // Should be locked down
        {
          permissionLevel: 'editor',
          assignee: { group: 'user', id: submitterUser.id }
        },
        {
          permissionLevel: 'editor',
          assignee: { group: 'space', id: space.id }
        }
      ]
    });

    const { permissions } = await lockPagePermissionsToBountyCreator({ resourceId: bounty.page.id });

    expect(permissions.length).toBe(4);
    // Unchanged
    expect(permissions.some((p) => p.roleId === role.id && p.permissionLevel === 'view_comment'));
    // Auto-set
    expect(permissions.some((p) => p.userId === user.id && p.permissionLevel === 'full_access'));
    // Locked down
    expect(permissions.some((p) => p.spaceId === space.id && p.permissionLevel === 'view'));
    expect(permissions.some((p) => p.userId === submitterUser.id && p.permissionLevel === 'view'));
  });

  it('should apply the new permissions to child pages of the bounty', async () => {
    const submitterUser = await testUtilsUser.generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });

    const role = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id
    });

    const bounty = await testUtilsBounties.generateBounty({
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
          assignee: { group: 'role', id: role.id }
        },
        // Should be locked down
        {
          permissionLevel: 'editor',
          assignee: { group: 'user', id: submitterUser.id }
        },
        {
          permissionLevel: 'editor',
          assignee: { group: 'space', id: space.id }
        }
      ]
    });

    const childPage = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      parentId: bounty.page.id
    });

    const { permissions } = await lockPagePermissionsToBountyCreator({ resourceId: bounty.page.id });

    expect(permissions.length).toBe(4);
    // Unchanged
    expect(permissions.some((p) => p.roleId === role.id && p.permissionLevel === 'view_comment'));
    // Auto-set
    expect(permissions.some((p) => p.userId === user.id && p.permissionLevel === 'full_access'));
    // Locked down
    expect(permissions.some((p) => p.spaceId === space.id && p.permissionLevel === 'view'));
    expect(permissions.some((p) => p.userId === submitterUser.id && p.permissionLevel === 'view'));

    const childPermissions = await prisma.pagePermission.findMany({
      where: {
        pageId: childPage.id
      }
    });

    expect(childPermissions.length).toBe(4);
    // Unchanged
    expect(
      childPermissions.some(
        (p) =>
          p.roleId === role.id &&
          p.permissionLevel === 'view_comment' &&
          permissions.some((parent) => parent.id === p.inheritedFromPermission)
      )
    );
    // Auto-set
    expect(
      childPermissions.some(
        (p) =>
          p.userId === user.id &&
          p.permissionLevel === 'full_access' &&
          permissions.some((parent) => parent.id === p.inheritedFromPermission)
      )
    );
    // Locked down
    expect(
      childPermissions.some(
        (p) =>
          p.spaceId === space.id &&
          p.permissionLevel === 'view' &&
          permissions.some((parent) => parent.id === p.inheritedFromPermission)
      )
    );
    expect(
      childPermissions.some(
        (p) =>
          p.userId === submitterUser.id &&
          p.permissionLevel === 'view' &&
          permissions.some((parent) => parent.id === p.inheritedFromPermission)
      )
    );
  });

  it('should not provide access to the space if the space was not previously authorised', async () => {
    const role = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id
    });

    const bounty = await testUtilsBounties.generateBounty({
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
            group: 'role',
            id: role.id
          }
        ]
      },
      pagePermissions: [
        {
          permissionLevel: 'view_comment',
          assignee: { group: 'role', id: role.id }
        }
      ]
    });

    const { permissions } = await lockPagePermissionsToBountyCreator({ resourceId: bounty.page.id });

    expect(permissions.length).toBe(2);
    // Unchanged
    expect(permissions.some((p) => p.roleId === role.id && p.permissionLevel === 'view_comment'));
    // Auto-set
    expect(permissions.some((p) => p.userId === user.id && p.permissionLevel === 'full_access'));
  });

  it('should throw an error if targeting a page without a bounty', async () => {
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      type: 'page'
    });

    await expect(lockPagePermissionsToBountyCreator({ resourceId: page.id })).rejects.toBeInstanceOf(DataNotFoundError);
  });
});
