import type { Space, User } from '@prisma/client';
import { SpaceRole } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { InvalidInputError } from 'lib/utilities/errors';
import { generateUserAndSpace, generateSpaceUser } from 'testing/setupDatabase';

import { AdministratorOnlyError, UserIsNotSpaceMemberError } from '../errors';
import { hasAccessToSpace } from '../hasAccessToSpace';

let space: Space;
let adminUser: User;
let memberUser: User;

let outsideUser: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace({ isAdmin: true });
  space = generated.space;
  adminUser = generated.user;
  memberUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
  outsideUser = await prisma.user.create({
    data: {
      username: 'Test user'
    }
  });
});

describe('hasAccessToSpace', () => {
  it('should return an error if userId or spaceId is empty', async () => {
    const { error } = await hasAccessToSpace({
      spaceId: space.id,
      userId: undefined
    });

    expect(error).toBeInstanceOf(InvalidInputError);

    const { error: secondError } = await hasAccessToSpace({
      spaceId: undefined as any,
      userId: adminUser.id
    });

    expect(error).toBeInstanceOf(InvalidInputError);
  });

  it('should return success and admin status of the admin user', async () => {
    const { success, isAdmin, error } = await hasAccessToSpace({
      spaceId: space.id,
      userId: adminUser.id
    });

    expect(error).toBeUndefined();
    expect(success).toBe(true);
    expect(isAdmin).toBe(true);
  });

  it('should return success and admin status of the member user', async () => {
    const { success, isAdmin, error } = await hasAccessToSpace({
      spaceId: space.id,
      userId: memberUser.id
    });

    expect(error).toBeUndefined();
    expect(success).toBe(true);
    expect(isAdmin).toBe(false);
  });

  it('should return an error if user is a space member, but not an admin', async () => {
    const { success, isAdmin, error } = await hasAccessToSpace({
      spaceId: space.id,
      userId: memberUser.id,
      adminOnly: true
    });

    expect(error).toBeInstanceOf(AdministratorOnlyError);
    expect(success).toBeUndefined();
    expect(isAdmin).toBeUndefined();
  });

  it('should return an error for non space members', async () => {
    const { success, isAdmin, error } = await hasAccessToSpace({
      spaceId: space.id,
      userId: outsideUser.id
    });

    expect(error).toBeInstanceOf(UserIsNotSpaceMemberError);
    expect(success).toBeUndefined();
    expect(isAdmin).toBeUndefined();
  });
});
