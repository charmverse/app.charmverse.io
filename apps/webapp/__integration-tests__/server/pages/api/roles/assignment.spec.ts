/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Role, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

import type { RoleAssignment } from '@packages/lib/roles';
import { assignRole } from '@packages/lib/roles';

describe('POST /api/roles/assignment - Assign a user to a role', () => {
  let space: Space;
  let adminUser: User;
  let nonAdminUser: User;
  let role: Role;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
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

  it('should succeed if the requesting user is a space admin, and respond 201', async () => {
    const roleAssignment: RoleAssignment = {
      roleId: role.id,
      userId: nonAdminUser.id
    };

    const adminCookie = await loginUser(adminUser.id);

    await request(baseUrl).post('/api/roles/assignment').set('Cookie', adminCookie).send(roleAssignment).expect(201);

    const userRoleRecord = await prisma.spaceRoleToRole.count({
      where: {
        roleId: role.id,
        spaceRole: {
          userId: nonAdminUser.id
        }
      }
    });
    expect(userRoleRecord).toBe(1);
  });

  it('should fail if the requesting user is not a space admin, and respond 401', async () => {
    const roleAssignment: RoleAssignment = {
      roleId: role.id,
      userId: nonAdminUser.id
    };

    const nonAdminCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl).post('/api/roles/assignment').set('Cookie', nonAdminCookie).send(roleAssignment).expect(401);
  });
});

describe('DELETE /api/roles/assignment - Unassign a user from a role', () => {
  let space: Space;
  let adminUser: User;
  let nonAdminUser: User;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    space = generated.space;
    adminUser = generated.user;
    nonAdminUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });
  });
  it('should succeed if the requesting user is a space admin, and respond 200', async () => {
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

    await request(baseUrl).delete('/api/roles/assignment').set('Cookie', adminCookie).query(roleAssignment).expect(200);
    const userRoleRecord = await prisma.spaceRoleToRole.count({
      where: {
        roleId: role.id,
        spaceRole: {
          userId: nonAdminUser.id
        }
      }
    });
    expect(userRoleRecord).toBe(0);
  });

  it('should fail if the requesting user is not a space admin, and respond 401', async () => {
    const role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [nonAdminUser.id]
    });

    const roleAssignment: RoleAssignment = {
      roleId: role.id,
      userId: nonAdminUser.id
    };

    const userCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl).delete('/api/roles/assignment').set('Cookie', userCookie).query(roleAssignment).expect(401);
  });
});
