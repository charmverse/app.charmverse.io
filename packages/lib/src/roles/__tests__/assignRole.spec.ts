import type { Space, User } from '@charmverse/core/prisma';
import { InvalidStateError } from '@packages/nextjs/errors';
import { ExpectedAnError } from '@packages/testing/errors';
import {
  generateRole,
  generateSpaceUser,
  generateUserAndSpace,
  generateUserAndSpaceWithApiToken
} from '@packages/testing/setupDatabase';
import { DataNotFoundError, InsecureOperationError, UndesirableOperationError } from '@packages/utils/errors';
import { assignRole, listRoleMembers } from '@packages/lib/roles';
import { v4 } from 'uuid';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('assignRole', () => {
  it('should assign a user to a role and return the role with all current assignees', async () => {
    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id
    });

    await assignRole({
      roleId: role.id,
      userId: user.id
    });

    let roleAfterAssignment = await listRoleMembers({ roleId: role.id });

    expect(roleAfterAssignment.users.length).toBe(1);
    expect(roleAfterAssignment.users[0].id).toBe(user.id);

    const extraUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    await assignRole({
      roleId: role.id,
      userId: extraUser.id
    });

    roleAfterAssignment = await listRoleMembers({ roleId: role.id });

    expect(roleAfterAssignment.users.length).toBe(2);
    expect(roleAfterAssignment.users.some((u) => u.id === extraUser.id));
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
    } catch (err) {
      expect(err).toBeInstanceOf(InsecureOperationError);
    }
  });

  it('should fail if the user is a guest of the target space', async () => {
    const { user: adminUser, space: spaceWithGuest } = await generateUserAndSpace({
      isAdmin: true
    });

    const guestUser = await generateSpaceUser({
      spaceId: spaceWithGuest.id,
      isGuest: true
    });

    const role = await generateRole({
      spaceId: spaceWithGuest.id,
      createdBy: adminUser.id
    });

    await expect(
      assignRole({
        roleId: role.id,
        userId: guestUser.id
      })
    ).rejects.toBeInstanceOf(InvalidStateError);
  });

  it('should fail if the role does not exist', async () => {
    try {
      await assignRole({
        roleId: v4(),
        userId: user.id
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

  it('should fail if the summon role is being assigned', async () => {
    const { user: adminUser, space: spaceWithGuest } = await generateUserAndSpace({
      isAdmin: true
    });

    const role = await generateRole({
      spaceId: spaceWithGuest.id,
      createdBy: adminUser.id,
      source: 'summon'
    });

    await expect(
      assignRole({
        roleId: role.id,
        userId: user.id
      })
    ).rejects.toThrow(UndesirableOperationError);
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
    } catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });
});
