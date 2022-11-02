
import type { Space } from '@prisma/client';

import { getSpaceMemberRoles } from 'lib/members/getSpaceMemberRoles';
import { assignRole } from 'lib/roles';
import type { LoggedInUser } from 'models';
import { generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { addUserToSpace, generateSpaceForUser } from 'testing/utils/spaces';

let user1: LoggedInUser;
let user2: LoggedInUser;

let u1Space1: Space;
let u1Space2: Space;

beforeAll(async () => {
  // User with 2 spaces
  const { user: u1, space } = await generateUserAndSpaceWithApiToken(undefined, true);
  user1 = u1;
  u1Space1 = space;
  u1Space2 = await generateSpaceForUser(user1);

  // User with 2 spaces, 1 common with user 1
  const { user: u2 } = await generateUserAndSpaceWithApiToken(undefined, true);
  user2 = await addUserToSpace({ spaceId: u1Space1.id, userId: u2.id, isAdmin: false });
  await generateSpaceForUser(user2);

  const role1 = await generateRole({ spaceId: u1Space1.id, roleName: 'test role 1', createdBy: u1.id });
  const role2 = await generateRole({ spaceId: u1Space1.id, roleName: 'test role 2', createdBy: u1.id });
  const role3 = await generateRole({ spaceId: u1Space2.id, roleName: 'test role 3', createdBy: u1.id });

  await assignRole({ roleId: role1.id, userId: u1.id });
  await assignRole({ roleId: role2.id, userId: u1.id });
  await assignRole({ roleId: role3.id, userId: u1.id });

  await assignRole({ roleId: role1.id, userId: u2.id });
});

describe('getSpaceMemberRoles', () => {

  it('should retrieve admin user roles for single space', async () => {

    const rolesMap = await getSpaceMemberRoles({ spaceIds: u1Space1.id, memberId: user1.id });

    expect(rolesMap[u1Space1.id].length).toBe(2);
    expect(rolesMap[u1Space2.id]).toBeUndefined();
  });

  it('should retrieve admin user roles for multiple spaces', async () => {
    const rolesMap = await getSpaceMemberRoles({ spaceIds: [u1Space1.id, u1Space2.id], memberId: user1.id });

    expect(rolesMap[u1Space1.id]?.length).toBe(2);
    expect(rolesMap[u1Space2.id]?.length).toBe(1);
  });

  it('should not return roles if user is not a member of space', async () => {
    const rolesMap = await getSpaceMemberRoles({ spaceIds: [u1Space2.id], memberId: user2.id });

    expect(rolesMap[u1Space2.id]).toBeUndefined();
    expect(rolesMap[u1Space1.id]).toBeUndefined();
  });

  it('should retrieve non-admin user roles for single space', async () => {
    const rolesMap = await getSpaceMemberRoles({ spaceIds: [u1Space1.id], memberId: user2.id });

    expect(rolesMap[u1Space1.id]?.length).toBe(1);
  });
});
