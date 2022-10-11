
import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { assignRole, listRoleMembers } from 'lib/roles';
import { DataNotFoundError } from 'lib/utilities/errors';
import { ExpectedAnError } from 'testing/errors';
import { generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
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
    }
    catch (err) {
      expect(err).toBeInstanceOf(DataNotFoundError);
    }
  });

});
