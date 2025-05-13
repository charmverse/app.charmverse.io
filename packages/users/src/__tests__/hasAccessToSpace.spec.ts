import type { Space, User } from '@charmverse/core/prisma';
import { SpaceRole } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { generateUserAndSpace, generateSpaceUser } from '@packages/testing/setupDatabase';
import { InvalidInputError } from '@packages/utils/errors';
import { uid } from '@packages/utils/strings';
import { v4 } from 'uuid';

import { AdministratorOnlyError, UserIsGuestError, UserIsNotSpaceMemberError } from '../errors';
import { hasAccessToSpace } from '../hasAccessToSpace';

let space: Space;
let adminUser: User;
let memberUser: User;
let guestUser: User;

let outsideUser: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace({ isAdmin: true });
  space = generated.space;
  adminUser = generated.user;
  memberUser = await generateSpaceUser({ spaceId: space.id, isAdmin: false });
  outsideUser = await prisma.user.create({
    data: {
      path: uid(),
      username: 'Test user'
    }
  });
  guestUser = await generateSpaceUser({
    spaceId: space.id,
    isGuest: true
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

  it('should return success if user is a guest and disallow guest is undefined', async () => {
    const { success, isAdmin, error } = await hasAccessToSpace({
      spaceId: space.id,
      userId: guestUser.id
    });

    expect(error).toBeUndefined();
    expect(success).toBe(true);
    expect(isAdmin).toBe(false);
  });

  it('should return success if user is a guest and disallow guest is false', async () => {
    const { success, isAdmin, error } = await hasAccessToSpace({
      spaceId: space.id,
      userId: guestUser.id,
      disallowGuest: false
    });

    expect(error).toBeUndefined();
    expect(success).toBe(true);
    expect(isAdmin).toBe(false);
  });

  it('should return an error if user is a guest and disallow guest is true', async () => {
    const { success, isAdmin, error } = await hasAccessToSpace({
      spaceId: space.id,
      userId: guestUser.id,
      disallowGuest: true
    });

    expect(error).toBeInstanceOf(UserIsGuestError);
    expect(success).toBeUndefined();
    expect(isAdmin).toBeUndefined();
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
