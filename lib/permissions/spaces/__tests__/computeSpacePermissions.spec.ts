import type { Space, SpacePermission } from '@prisma/client';
import { SpaceOperation } from '@prisma/client';

import { prisma } from 'db';
import { assignRole } from 'lib/roles';
import {
  generateRole,
  generateSpaceUser,
  generateUserAndSpace,
  generateUserAndSpaceWithApiToken
} from 'testing/setupDatabase';

import { addSpaceOperations } from '../addSpaceOperations';
import { computeSpacePermissions } from '../computeSpacePermissions';
import type { SpacePermissionFlags } from '../interfaces';

let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
});

describe('computeSpacePermissions', () => {
  it('should ignore space permissions if applicable role permissions exist', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpace({
      isAdmin: false
    });

    const otherSpaceUserWithRole = await generateSpaceUser({
      spaceId: otherSpace.id,
      isAdmin: false
    });

    const role = await generateRole({
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
      allowAdminBypass: false,
      resourceId: otherSpace.id,
      userId: otherUser.id
    });

    expect(userPermissions).toMatchObject(
      expect.objectContaining<SpacePermissionFlags>({
        createBounty: true,
        createForumCategory: true,
        createPage: true,
        moderateForums: false,
        reviewProposals: false
      })
    );

    // User permissions should be defaulted to what is available to the role
    const userWithRolePermissions = await computeSpacePermissions({
      allowAdminBypass: false,
      resourceId: otherSpace.id,
      userId: otherSpaceUserWithRole.id
    });

    expect(userWithRolePermissions).toMatchObject(
      expect.objectContaining<SpacePermissionFlags>({
        createBounty: false,
        createForumCategory: false,
        createPage: false,
        moderateForums: false,
        reviewProposals: false
      })
    );
  });

  it('should give user space permissions via their role', async () => {
    const extraUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const role = await generateRole({
      spaceId: space.id,
      createdBy: extraUser.id
    });

    await assignRole({
      roleId: role.id,
      userId: extraUser.id
    });

    await addSpaceOperations<'role'>({
      forSpaceId: space.id,
      operations: ['createPage'],
      roleId: role.id
    });

    const computedPermissions = await computeSpacePermissions({
      allowAdminBypass: false,
      resourceId: space.id,
      userId: extraUser.id
    });

    expect(computedPermissions.createPage).toBe(true);
    expect(computedPermissions.createBounty).toBe(false);
  });

  it('should give user space permissions via their space membership', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    await addSpaceOperations<'space'>({
      forSpaceId: otherSpace.id,
      operations: ['createBounty'],
      spaceId: otherSpace.id
    });

    const computedPermissions = await computeSpacePermissions({
      allowAdminBypass: false,
      resourceId: otherSpace.id,
      userId: otherUser.id
    });

    expect(computedPermissions.createPage).toBe(false);
    expect(computedPermissions.createBounty).toBe(true);
  });

  it('should give user space permissions as an individual', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    await addSpaceOperations<'user'>({
      forSpaceId: otherSpace.id,
      operations: ['createBounty'],
      userId: otherUser.id
    });

    const computedPermissions = await computeSpacePermissions({
      allowAdminBypass: false,
      resourceId: otherSpace.id,
      userId: otherUser.id
    });

    expect(computedPermissions.createPage).toBe(false);
    expect(computedPermissions.createBounty).toBe(true);
  });

  it('should return true to all operations if user is a space admin and admin bypass was enabled', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    const computedPermissions = await computeSpacePermissions({
      allowAdminBypass: true,
      resourceId: otherSpace.id,
      userId: otherUser.id
    });

    expect(computedPermissions.createPage).toBe(true);
    expect(computedPermissions.createBounty).toBe(true);
  });

  it('should return true only for operations the user has access to if they are a space admin and admin bypass was disabled', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    await addSpaceOperations({
      forSpaceId: otherSpace.id,
      operations: ['createBounty'],
      userId: otherUser.id
    });

    const computedPermissions = await computeSpacePermissions({
      allowAdminBypass: false,
      resourceId: otherSpace.id,
      userId: otherUser.id
    });

    expect(computedPermissions.createPage).toBe(false);
    expect(computedPermissions.createBounty).toBe(true);
  });

  it('should contain all Space Operations as keys, with no additional or missing properties', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const computedPermissions = await computeSpacePermissions({
      allowAdminBypass: false,
      resourceId: otherSpace.id,
      userId: otherUser.id
    });

    // Check the object has no extra keys
    (Object.keys(computedPermissions) as SpaceOperation[]).forEach((key) => {
      expect(SpaceOperation[key]).toBeDefined();
    });

    // Check the object has no missing keys
    (Object.keys(SpaceOperation) as SpaceOperation[]).forEach((key) => {
      expect(computedPermissions[key]).toBeDefined();
    });
  });

  it('should return false to all operations if the the user is not a member of the space', async () => {
    const { user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    const computedPermissions = await computeSpacePermissions({
      allowAdminBypass: true,
      resourceId: space.id,
      userId: otherUser.id
    });

    expect(computedPermissions.createPage).toBe(false);
    expect(computedPermissions.createBounty).toBe(false);
  });
});
