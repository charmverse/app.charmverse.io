
import type { Space, User } from '@prisma/client';
import { SpacePermission } from '@prisma/client';
import { v4 } from 'uuid';

import { prisma } from 'db';
import { assignRole } from 'lib/roles';
import { generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { ExpectedAnError } from '../../../testing/errors';
import { DataNotFoundError, InsecureOperationError } from '../../utilities/errors';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  user = generated.user;
  space = generated.space;
});

describe('assignRole', () => {

  it('should assign a user to a role and return the role with all current assignees', async () => {

    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id
    });

    let roleAfterAssignment = await assignRole({
      roleId: role.id,
      userId: user.id
    });

    expect(roleAfterAssignment.users.length).toBe(1);
    expect(roleAfterAssignment.users[0].id).toBe(user.id);

    const extraUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    roleAfterAssignment = await assignRole({
      roleId: role.id,
      userId: extraUser.id
    });

    expect(roleAfterAssignment.users.length).toBe(2);
    expect(roleAfterAssignment.users.some(u => u.id === extraUser.id));

  });

  it('should fail if the user is not a member of the space', async () => {
    const { user: userInOtherSpace } = await generateUserAndSpaceWithApiToken();

    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id
    });

    try {
      await assignRole({
        roleId: role.id,
        userId: userInOtherSpace.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(InsecureOperationError);
    }
  });

  it('should fail if the role does not exist', async () => {
    try {
      await assignRole({
        roleId: v4(),
        userId: user.id
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('should fail if the user does not exist', async () => {
    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id
    });

    try {
      await assignRole({
        roleId: role.id,
        userId: v4()
      });
      throw new ExpectedAnError();
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

});
