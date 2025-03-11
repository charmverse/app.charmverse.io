import type { Space, User } from '@charmverse/core/prisma';
import { SpaceOperation } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { ExpectedAnError } from '@packages/testing/errors';
import { generateRole, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { InvalidInputError } from '@packages/utils/errors';
import { v4 } from 'uuid';

import { addSpaceOperations } from '../addSpaceOperations';
import { computeGroupSpacePermissions } from '../computeGroupSpacePermissions';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('computeGroupSpacePermissions', () => {
  it('should return true only for permissions a space has been directly assigned', async () => {
    const { space: otherSpace } = await generateUserAndSpaceWithApiToken(undefined, false);

    await addSpaceOperations<'space'>({
      forSpaceId: otherSpace.id,
      operations: ['createBounty'],
      spaceId: otherSpace.id
    });

    const computedPermissions = await computeGroupSpacePermissions({
      resourceId: otherSpace.id,
      group: 'space',
      id: otherSpace.id
    });

    expect(computedPermissions.createPage).toBe(false);
    expect(computedPermissions.createBounty).toBe(true);
  });

  it('should return true only for permissions a role has been directly assigned', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const role = await generateRole({
      createdBy: otherUser.id,
      spaceId: otherSpace.id
    });

    // This should be ignored during permissions compute
    await addSpaceOperations<'space'>({
      forSpaceId: otherSpace.id,
      operations: ['createPage'],
      spaceId: otherSpace.id
    });

    await addSpaceOperations<'role'>({
      forSpaceId: otherSpace.id,
      operations: ['createBounty'],
      roleId: role.id
    });

    const computedPermissions = await computeGroupSpacePermissions({
      resourceId: otherSpace.id,
      group: 'role',
      id: role.id
    });

    expect(computedPermissions.createPage).toBe(false);
    expect(computedPermissions.createBounty).toBe(true);
  });

  it('should return true only for permissions a user has been directly assigned', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const role = await generateRole({
      createdBy: otherUser.id,
      spaceId: otherSpace.id
    });

    // This should be ignored during permissions compute
    await addSpaceOperations<'space'>({
      forSpaceId: otherSpace.id,
      operations: ['createPage'],
      spaceId: otherSpace.id
    });

    // This should be ignored during permissions compute
    await addSpaceOperations<'role'>({
      forSpaceId: otherSpace.id,
      operations: ['createBounty'],
      roleId: role.id
    });

    const computedPermissions = await computeGroupSpacePermissions({
      resourceId: otherSpace.id,
      group: 'user',
      id: otherUser.id
    });

    expect(computedPermissions.createPage).toBe(false);
    expect(computedPermissions.createBounty).toBe(false);
  });

  it('should contain all Space Operations as keys, with no additional or missing properties', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const computedPermissions = await computeGroupSpacePermissions({
      resourceId: otherSpace.id,
      group: 'user',
      id: otherUser.id
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

  it('should return false for all permissions if a different space than the target space is provided', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    // A permission our business logic wouldn't allow to be created, so we use prisma directly
    await prisma.spacePermission.create({
      data: {
        operations: ['createBounty', 'createPage'],
        forSpace: {
          connect: {
            id: space.id
          }
        },
        space: {
          connect: {
            id: otherSpace.id
          }
        }
      }
    });

    const computedPermissions = await computeGroupSpacePermissions({
      resourceId: space.id,
      group: 'space',
      id: otherSpace.id
    });

    expect(computedPermissions.createPage).toBe(false);
    expect(computedPermissions.createBounty).toBe(false);
  });

  it('should return false for all permissions if a role that is not defined in the target space is provided', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const role = await generateRole({
      createdBy: otherUser.id,
      spaceId: otherSpace.id
    });

    // A permission our business logic wouldn't allow to be created, so we use prisma directly
    await prisma.spacePermission.create({
      data: {
        operations: ['createBounty', 'createPage'],
        forSpace: {
          connect: {
            id: space.id
          }
        },
        role: {
          connect: {
            id: role.id
          }
        }
      }
    });

    const computedPermissions = await computeGroupSpacePermissions({
      resourceId: space.id,
      group: 'role',
      id: role.id
    });

    expect(computedPermissions.createPage).toBe(false);
    expect(computedPermissions.createBounty).toBe(false);
  });

  it('should return false for all permissions if a user that is not a member of the target space is provided', async () => {
    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    // A permission our business logic wouldn't allow to be created, so we use prisma directly
    await prisma.spacePermission.create({
      data: {
        operations: ['createBounty', 'createPage'],
        forSpace: {
          connect: {
            id: space.id
          }
        },
        user: {
          connect: {
            id: otherUser.id
          }
        }
      }
    });

    const computedPermissions = await computeGroupSpacePermissions({
      resourceId: space.id,
      group: 'user',
      id: user.id
    });

    expect(computedPermissions.createPage).toBe(false);
    expect(computedPermissions.createBounty).toBe(false);
  });

  it('should fail if invalid input is provided', async () => {
    try {
      await computeGroupSpacePermissions({
        id: v4(),
        resourceId: v4(),
        group: 'randomInvalidGroup' as any
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }
  });
});
