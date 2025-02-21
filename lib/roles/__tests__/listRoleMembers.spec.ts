import type { Space, User } from '@charmverse/core/prisma';
import { ExpectedAnError } from '@packages/testing/errors';
import { generateRole, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { DataNotFoundError } from '@packages/utils/errors';
import { assignRole, listRoleMembers } from '@root/lib/roles';
import { v4 } from 'uuid';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  user = generated.user;
  space = generated.space;
});

describe('listRoleMembers', () => {
  it('should return the list of users in a role', async () => {
    const role = await generateRole({
      spaceId: space.id,
      createdBy: user.id
    });

    await assignRole({
      roleId: role.id,
      userId: user.id
    });

    const roleAfterAssignment = await listRoleMembers({
      roleId: role.id
    });

    expect(roleAfterAssignment.users.length).toBe(1);
    expect(roleAfterAssignment.users[0].id).toBe(user.id);
  });

  it('should fail if the role does not exist', async () => {
    try {
      await listRoleMembers({
        roleId: v4()
      });
      throw new ExpectedAnError();
    } catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });
});
