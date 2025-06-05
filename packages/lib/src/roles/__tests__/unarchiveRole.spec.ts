import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { ExpectedAnError } from '@packages/testing/errors';
import { generateRole, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { DataNotFoundError, InvalidInputError, UndesirableOperationError } from '@packages/utils/errors';
import { v4 } from 'uuid';

import { unarchiveRole } from '../unarchiveRole';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('unarchiveRole', () => {
  it('should unarchive a role successfully', async () => {
    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id,
      archived: true
    });

    const unarchived = await unarchiveRole({
      roleId: role.id,
      userId: user.id
    });

    expect(unarchived.archived).toBe(false);

    const roleInDb = await prisma.role.findUnique({
      where: {
        id: role.id
      }
    });

    expect(roleInDb?.archived).toBe(false);
  });

  it('should fail if the role does not exist', async () => {
    try {
      await unarchiveRole({
        roleId: v4(),
        userId: user.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('should fail if the role is not archived', async () => {
    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id
    });

    try {
      await unarchiveRole({
        roleId: role.id,
        userId: user.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should fail if trying to unarchive a role managed by guild.xyz', async () => {
    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id,
      source: 'guild_xyz',
      archived: true
    });

    try {
      await unarchiveRole({
        roleId: role.id,
        userId: user.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      if (err instanceof Error) {
        expect(err).toBeInstanceOf(UndesirableOperationError);
      }
    }
  });

  it('should fail if trying to unarchive a role managed by summon', async () => {
    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id,
      source: 'summon',
      archived: true
    });

    try {
      await unarchiveRole({
        roleId: role.id,
        userId: user.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      if (err instanceof Error) {
        expect(err).toBeInstanceOf(UndesirableOperationError);
      }
    }
  });

  it('should fail if unarchiving would exceed the space tier limit', async () => {
    // First create roles up to the limit
    const maxRoles = 3; // Assuming free tier limit
    await Promise.all(
      Array(maxRoles)
        .fill(null)
        .map(() =>
          generateRole({
            spaceId: space.id,
            createdBy: user.id
          })
        )
    );

    // Create an archived role
    const archivedRole = await generateRole({
      spaceId: space.id,
      createdBy: user.id,
      archived: true
    });

    try {
      await unarchiveRole({
        roleId: archivedRole.id,
        userId: user.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      if (err instanceof Error) {
        expect(err).toBeInstanceOf(UndesirableOperationError);
        expect(err.message).toContain('maximum number of roles');
      }
    }
  });
});
