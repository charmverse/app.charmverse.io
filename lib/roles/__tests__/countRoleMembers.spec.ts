import type { Space, User } from '@prisma/client';
import { v4 } from 'uuid';

import { generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import { assignRole } from '../assignRole';
import { countRoleMembers } from '../countRoleMembers';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken(v4());
  user = generated.user;
  space = generated.space;
});

describe('countRoleMembers', () => {
  it('should count the number of people assigned to this role', async () => {
    const role = await generateRole({
      createdBy: user.id,
      spaceId: space.id
    });

    const [user1, user2] = await Promise.all([
      generateSpaceUser({
        isAdmin: false,
        spaceId: space.id
      }),
      generateSpaceUser({
        isAdmin: false,
        spaceId: space.id
      })
    ]);

    await Promise.all([
      assignRole({
        roleId: role.id,
        userId: user1.id
      }),
      assignRole({
        roleId: role.id,
        userId: user2.id
      })
    ]);

    const roleup = await countRoleMembers({
      roleId: role.id
    });

    expect(roleup.members).toBe(2);

  });

  it('should return a count of 0 if the role does not exist', async () => {
    const roleup = await countRoleMembers({
      roleId: v4()
    });

    expect(roleup.members).toBe(0);
  });
});
