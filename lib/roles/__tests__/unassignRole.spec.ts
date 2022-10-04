
import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { assignRole } from 'lib/roles';
import { DataNotFoundError, InvalidInputError, UndesirableOperationError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { unassignRole } from '../unassignRole';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  user = generated.user;
  space = generated.space;
});

describe('unassignRole', () => {

  it('should unassign a user from a role and return the role with all current assignees', async () => {

    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id
    });

    await assignRole({
      roleId: role.id,
      userId: user.id
    });

    const roleAfterUserRemoved = await unassignRole({
      roleId: role.id,
      userId: user.id
    });

    expect(roleAfterUserRemoved.users.length).toBe(0);

  });

  it('should fail if the role does not exist', async () => {

    try {
      await unassignRole({
        roleId: v4(),
        userId: user.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('should fail if the user is not assigned to the role', async () => {

    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id
    });

    try {
      await unassignRole({
        roleId: role.id,
        userId: user.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InvalidInputError);
    }
  });

  it('should fail if trying to unassign a user from a role managed by guild.xyz', async () => {

    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id,
      source: 'guild_xyz'
    });

    await assignRole({
      roleId: role.id,
      userId: user.id
    });

    try {
      await unassignRole({
        roleId: role.id,
        userId: user.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(UndesirableOperationError);
    }
  });

});
