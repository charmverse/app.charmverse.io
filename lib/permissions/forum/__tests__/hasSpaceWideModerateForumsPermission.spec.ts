import type { Space, User } from '@prisma/client';

import { addSpaceOperations } from 'lib/permissions/spaces';
import { InvalidInputError } from 'lib/utilities/errors';
import { generateRole, generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';

import { hasSpaceWideModerateForumsPermission } from '../hasSpaceWideModerateForumsPermission';

let space: Space;
let user: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  space = generated.space;
  user = generated.user;
});

describe('hasSpaceWideModerateForumsPermission', () => {
  it('should return true if user has a role with space-wide moderate forums permission', async () => {
    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id,
      assigneeUserIds: [user.id]
    });

    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['moderate_forums'],
      roleId: role.id
    });

    const result = await hasSpaceWideModerateForumsPermission({ spaceId: space.id, userId: user.id });

    expect(result).toBe(true);
  });

  it('should return true if user is a space admin', async () => {
    const adminUser = await generateSpaceUser({
      isAdmin: true,
      spaceId: space.id
    });

    const result = await hasSpaceWideModerateForumsPermission({ spaceId: space.id, userId: adminUser.id });

    expect(result).toBe(true);
  });

  it('should return false if userId is undefined', async () => {
    const result = await hasSpaceWideModerateForumsPermission({ spaceId: space.id, userId: undefined });

    expect(result).toBe(false);
  });

  it('should return false if user does not have a role with space-wide moderate forums permission', async () => {
    const userWithoutRoles = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });
    const result = await hasSpaceWideModerateForumsPermission({ spaceId: space.id, userId: userWithoutRoles.id });

    expect(result).toBe(false);
  });

  it('should throw an error if spaceid is undefined', async () => {
    await expect(hasSpaceWideModerateForumsPermission({ spaceId: undefined as any })).rejects.toBeInstanceOf(
      InvalidInputError
    );
  });
});
