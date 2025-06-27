import type { Space } from '@charmverse/core/prisma';
import { SpaceOperation } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import type { SpacePermissionFlags } from '@packages/core/permissions';
import { objectUtils } from '@packages/core/utilities';

import { addSpaceOperations } from '../addSpaceOperations';
import { computeSpacePermissions } from '../computeSpacePermissions';

let space: Space;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace();
  space = generated.space;
});

describe('computeSpacePermissions', () => {
  it('should ignore space permissions if applicable role permissions exist', async () => {
    const { space: otherSpace, user: otherUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false
    });

    const otherSpaceUserWithRole = await testUtilsUser.generateSpaceUser({
      spaceId: otherSpace.id,
      isAdmin: false
    });

    const role = await testUtilsMembers.generateRole({
      spaceId: otherSpace.id,
      createdBy: otherSpace.id,
      assigneeUserIds: [otherSpaceUserWithRole.id]
    });

    await prisma.spacePermission.create({
      data: {
        operations: ['createBounty', 'createForumCategory', 'createPage'],
        forSpace: {
          connect: {
            id: otherSpace.id
          }
        },
        space: {
          connect: {
            id: otherSpace.id
          }
        }
      }
    });

    await prisma.spacePermission.create({
      data: {
        operations: [],
        forSpace: {
          connect: {
            id: otherSpace.id
          }
        },
        role: {
          connect: {
            id: role.id
          }
        }
      }
    });
    // User should inherit space-wide permissions
    const userPermissions = await computeSpacePermissions({
      resourceId: otherSpace.id,
      userId: otherUser.id
    });

    expect(userPermissions).toMatchObject(
      expect.objectContaining<SpacePermissionFlags>({
        createBounty: true,
        createForumCategory: true,
        createPage: true,
        moderateForums: false,
        reviewProposals: false,
        deleteAnyBounty: false,
        deleteAnyPage: false,
        deleteAnyProposal: false,
        createProposals: false
      })
    );

    // User permissions should be defaulted to what is available to the role
    const userWithRolePermissions = await computeSpacePermissions({
      resourceId: otherSpace.id,
      userId: otherSpaceUserWithRole.id
    });

    expect(userWithRolePermissions).toMatchObject(
      expect.objectContaining<SpacePermissionFlags>({
        createBounty: false,
        createForumCategory: false,
        createPage: false,
        moderateForums: false,
        reviewProposals: false,
        deleteAnyBounty: false,
        deleteAnyPage: false,
        deleteAnyProposal: false,
        createProposals: false
      })
    );
  });

  it('should give user space permissions via their role', async () => {
    const extraUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const role = await testUtilsMembers.generateRole({
      spaceId: space.id,
      createdBy: extraUser.id,
      assigneeUserIds: [extraUser.id]
    });
    await addSpaceOperations({
      resourceId: space.id,
      operations: ['createPage', 'deleteAnyBounty', 'deleteAnyPage', 'deleteAnyProposal', 'createProposals'],
      assignee: {
        group: 'role',
        id: role.id
      }
    });

    const computedPermissions = await computeSpacePermissions({
      resourceId: space.id,
      userId: extraUser.id
    });

    expect(computedPermissions).toMatchObject<SpacePermissionFlags>({
      createPage: true,
      deleteAnyBounty: true,
      deleteAnyPage: true,
      deleteAnyProposal: true,
      createBounty: false,
      createForumCategory: false,
      moderateForums: false,
      reviewProposals: false,
      createProposals: true
    });
  });

  it('should give user space permissions via their space membership', async () => {
    const { space: otherSpace, user: otherUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false
    });

    await addSpaceOperations({
      resourceId: otherSpace.id,
      operations: ['createBounty'],
      assignee: {
        group: 'space',
        id: otherSpace.id
      }
    });

    const computedPermissions = await computeSpacePermissions({
      resourceId: otherSpace.id,
      userId: otherUser.id
    });

    expect(computedPermissions.createPage).toBe(false);
    expect(computedPermissions.createBounty).toBe(true);
  });

  it('should give user space permissions as an individual', async () => {
    const { space: otherSpace, user: otherUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false
    });

    await addSpaceOperations({
      resourceId: otherSpace.id,
      operations: ['createBounty'],
      assignee: {
        group: 'user',
        id: otherUser.id
      }
    });

    const computedPermissions = await computeSpacePermissions({
      resourceId: otherSpace.id,
      userId: otherUser.id
    });

    expect(computedPermissions.createPage).toBe(false);
    expect(computedPermissions.createBounty).toBe(true);
  });

  it('should return true to all operations if user is a space admin', async () => {
    const { space: otherSpace, user: otherUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const computedPermissions = await computeSpacePermissions({
      resourceId: otherSpace.id,
      userId: otherUser.id
    });

    expect(computedPermissions.createPage).toBe(true);
    expect(computedPermissions.createBounty).toBe(true);
  });

  it('should return empty permissions for guest users', async () => {
    const { space: testSpace, user } = await testUtilsUser.generateUserAndSpace({
      isGuest: true
    });

    await addSpaceOperations({
      resourceId: testSpace.id,
      assignee: {
        group: 'space',
        id: testSpace.id
      },
      operations: ['createBounty', 'createForumCategory', 'createPage']
    });

    const computedPermissions = await computeSpacePermissions({
      resourceId: testSpace.id,
      userId: user.id
    });

    expect(computedPermissions).toMatchObject(
      expect.objectContaining<SpacePermissionFlags>({
        createBounty: false,
        createForumCategory: false,
        createPage: false,
        moderateForums: false,
        reviewProposals: false,
        deleteAnyBounty: false,
        deleteAnyPage: false,
        deleteAnyProposal: false,
        createProposals: false
      })
    );
  });

  it('should contain all Space Operations as keys, with no additional or missing properties', async () => {
    const { space: otherSpace, user: otherUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false
    });

    const computedPermissions = await computeSpacePermissions({
      resourceId: otherSpace.id,
      userId: otherUser.id
    });

    // Check the object has no extra keys
    objectUtils.typedKeys(computedPermissions).forEach((key) => {
      expect(SpaceOperation[key]).toBeDefined();
    });

    // Check the object has no missing keys
    objectUtils.typedKeys(SpaceOperation).forEach((key) => {
      expect(computedPermissions[key]).toBeDefined();
    });
  });

  it('should return false to all operations if the the user is not a member of the space', async () => {
    const { user: otherUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const computedPermissions = await computeSpacePermissions({
      resourceId: space.id,
      userId: otherUser.id
    });

    expect(computedPermissions).toMatchObject(
      expect.objectContaining<SpacePermissionFlags>({
        createBounty: false,
        createForumCategory: false,
        createPage: false,
        moderateForums: false,
        reviewProposals: false,
        deleteAnyBounty: false,
        deleteAnyPage: false,
        deleteAnyProposal: false,
        createProposals: false
      })
    );
  });
});
