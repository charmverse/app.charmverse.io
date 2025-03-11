/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Role, Space, User } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

import type { RoleAssignment } from 'lib/roles';

describe('POST /api/roles/assignment - Assign a user to a role in free spaces', () => {
  let space: Space;
  let adminUser: User;
  let nonAdminUser: User;
  let role: Role;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'free'
    });
    space = generated.space;
    adminUser = generated.user;
    nonAdminUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
    role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id
    });
  });

  it('should fail for free spaces, and respond 402', async () => {
    const roleAssignment: RoleAssignment = {
      roleId: role.id,
      userId: nonAdminUser.id
    };

    const adminCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl).post('/api/roles/assignment').set('Cookie', adminCookie).send(roleAssignment).expect(402);
  });
});

describe('DELETE /api/roles/assignment - Unassign a user from a role in free spaces', () => {
  let space: Space;
  let adminUser: User;
  let nonAdminUser: User;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'free'
    });
    space = generated.space;
    adminUser = generated.user;
    nonAdminUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
  });
  it('should fail for free spaces, and respond 402', async () => {
    const role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [nonAdminUser.id]
    });

    const roleAssignment: RoleAssignment = {
      roleId: role.id,
      userId: nonAdminUser.id
    };

    const adminCookie = await loginUser(adminUser.id);

    await request(baseUrl).delete('/api/roles/assignment').set('Cookie', adminCookie).query(roleAssignment).expect(402);
  });
});
