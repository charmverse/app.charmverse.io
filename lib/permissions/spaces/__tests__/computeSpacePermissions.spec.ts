
import type { Space } from '@prisma/client';
import { SpaceOperation } from '@prisma/client';

import { assignRole } from 'lib/roles';
import { generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { addSpaceOperations } from '../addSpaceOperations';
import { computeSpacePermissions } from '../computeSpacePermissions';

let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
});

describe('computeSpacePermissions', () => {

  it('should combine permissions from user, role assignments and space membership', async () => {

    const { space: otherSpace, user: otherUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const role = await generateRole({
      spaceId: otherSpace.id,
      createdBy: otherUser.id
    });

    await assignRole({
      roleId: role.id,
      userId: otherUser.id
    });

    await addSpaceOperations<'role'>({
      forSpaceId: otherSpace.id,
      operations: ['createPage'],
      roleId: role.id
    });

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

    expect(computedPermissions.createPage).toBe(true);
    expect(computedPermissions.createBounty).toBe(true);

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
    (Object.keys(computedPermissions) as SpaceOperation[]).forEach(key => {
      expect(SpaceOperation[key]).toBeDefined();
    });

    // Check the object has no missing keys
    (Object.keys(SpaceOperation) as SpaceOperation[]).forEach(key => {
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
