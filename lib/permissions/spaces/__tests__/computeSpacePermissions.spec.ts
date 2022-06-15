
import { Space, SpacePermission, User } from '@prisma/client';
import { prisma } from 'db';
import { generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';
import { assignRole } from 'lib/roles';
import { computeSpacePermissions } from '../computeSpacePermissions';
import { addSpaceOperations } from '../addSpaceOperations';
import { removeSpaceOperations } from '../removeSpaceOperations';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  user = generated.user;
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
