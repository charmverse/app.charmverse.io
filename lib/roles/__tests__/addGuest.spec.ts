import type { Space } from '@prisma/client';
import { v4 } from 'uuid';

import { InvalidInputError } from 'lib/utilities/errors';
import { generateUserAndSpace } from 'testing/setupDatabase';
import { generateUser } from 'testing/utils/users';

import { addGuest } from '../addGuest';

let space: Space;
beforeAll(async () => {
  const generated = await generateUserAndSpace();
  space = generated.space;
});

describe('addGuest', () => {
  it('should add a guest by userId', async () => {
    const user = await generateUser();

    const output = await addGuest({
      userIdOrEmail: user.id,
      spaceId: space.id
    });

    const spaceRole = output.user.spaceRoles[0];
    expect(output.spaceDomain).toBe(space.domain);

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

    expect(output.spaceDomain).toBe(space.domain);

    expect(spaceRole.spaceId).toBe(space.id);
    expect(spaceRole.userId).toBe(user.id);
    expect(spaceRole.isGuest).toBe(true);
    expect(spaceRole.isAdmin).toBe(false);

    expect(output.isNewUser).toBe(false);
    expect(output.isNewSpaceRole).toBe(true);
  });

  it('should create the user if they do not exist, and mark the spaceRole and user as freshly created', async () => {
    const email = `test-${v4()}@example.com`;

    const output = await addGuest({
      userIdOrEmail: email,
      spaceId: space.id
    });

    const spaceRole = output.user.spaceRoles[0];

    expect(output.spaceDomain).toBe(space.domain);

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

    expect(output.spaceDomain).toBe(space2.domain);

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
