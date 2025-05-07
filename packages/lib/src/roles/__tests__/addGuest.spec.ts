import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generateUser } from '@packages/testing/utils/users';
import { InvalidInputError } from '@packages/utils/errors';
import { v4 } from 'uuid';

import { addGuest } from '../addGuest';

let space: Space;
beforeAll(async () => {
  const generated = await generateUserAndSpace();
  space = generated.space;
});

jest.mock('@packages/metrics/mixpanel/trackUserAction', () => ({
  trackUserAction: jest.fn()
}));

describe('addGuest', () => {
  it('should add a guest by userId', async () => {
    const user = await generateUser();

    const output = await addGuest({
      userIdOrEmail: user.id,
      spaceId: space.id
    });

    const spaceRole = output.user.spaceRoles[0];

    expect(spaceRole.spaceId).toBe(space.id);
    expect(spaceRole.userId).toBe(user.id);
    expect(spaceRole.isGuest).toBe(true);
    expect(spaceRole.isAdmin).toBe(false);

    expect(output.isNewUser).toBe(false);
    expect(output.isNewSpaceRole).toBe(true);
  });

  it('should add a guest by email', async () => {
    const email = `test-${v4()}@example.com`;
    const user = await generateUser({ verifiedEmail: email });

    const output = await addGuest({
      userIdOrEmail: email,
      spaceId: space.id
    });

    const spaceRole = output.user.spaceRoles[0];

    expect(spaceRole.spaceId).toBe(space.id);
    expect(spaceRole.userId).toBe(user.id);
    expect(spaceRole.isGuest).toBe(true);
    expect(spaceRole.isAdmin).toBe(false);

    expect(output.isNewUser).toBe(false);
    expect(output.isNewSpaceRole).toBe(true);
  });

  it('should add a guest by email and update claimed status', async () => {
    const email = `test-${v4()}@example.com`;
    const user = await generateUser({ verifiedEmail: email });
    await prisma.user.update({
      where: {
        id: user.id
      },
      data: {
        claimed: false
      }
    });

    const output = await addGuest({
      userIdOrEmail: email,
      spaceId: space.id
    });

    const spaceRole = output.user.spaceRoles[0];

    expect(spaceRole.spaceId).toBe(space.id);
    expect(spaceRole.userId).toBe(user.id);
    expect(spaceRole.isGuest).toBe(true);
    expect(spaceRole.isAdmin).toBe(false);

    expect(output.isNewUser).toBe(false);
    expect(output.isNewSpaceRole).toBe(true);

    const updatedUser = await prisma.user.findUnique({
      where: { id: user.id }
    });
    expect(trackUserAction as any).toHaveBeenCalledTimes(1);
    expect(trackUserAction as any).toBeCalledWith('sign_up', { userId: user.id, identityType: 'VerifiedEmail' });
    expect(updatedUser?.claimed).toBe(true);
  });

  it('should create the user if they do not exist, and mark the spaceRole and user as freshly created', async () => {
    const email = `test-${v4()}@example.com`;

    const output = await addGuest({
      userIdOrEmail: email,
      spaceId: space.id
    });

    const spaceRole = output.user.spaceRoles[0];
    expect(spaceRole.spaceId).toBe(space.id);

    expect(spaceRole.isGuest).toBe(true);
    expect(spaceRole.isAdmin).toBe(false);

    expect(output.isNewUser).toBe(true);
    expect(output.isNewSpaceRole).toBe(true);
  });

  it('should return the existing user if they are already a space member without modifying their space role', async () => {
    const { user, space: space2 } = await generateUserAndSpace();

    const output = await addGuest({
      spaceId: space2.id,
      userIdOrEmail: user.id
    });

    const spaceRole = output.user.spaceRoles[0];

    expect(spaceRole.spaceId).toBe(space2.id);

    // Most important assertion - Make sure a member didn't become a guest!
    expect(spaceRole.isGuest).toBe(false);

    expect(output.isNewUser).toBe(false);
    expect(output.isNewSpaceRole).toBe(false);
  });

  it('should throw an error if spaceId or userId are invalid', async () => {
    await expect(
      addGuest({
        spaceId: space.id,
        userIdOrEmail: 'random-input'
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
    await expect(
      addGuest({
        spaceId: 'random-input',
        userIdOrEmail: 'test@example.com'
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
