/* eslint-disable @typescript-eslint/no-unused-vars */
import request from 'supertest';

import { prisma } from 'db';
import type { RoleAssignment, RoleWithMembers } from 'lib/roles';
import { assignRole } from 'lib/roles';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('POST /api/roles/assignment - Assign a user to a role', () => {
  it('should succeed if the requesting user is a space admin, and respond 201', async () => {
    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);
    const extraUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const role = await generateRole({
      createdBy: adminUser.id,
      spaceId: space.id
    });

    const roleAssignment: RoleAssignment = {
      roleId: role.id,
      userId: extraUser.id
    };

    const adminCookie = await loginUser(adminUser.id);

    await request(baseUrl).post('/api/roles/assignment').set('Cookie', adminCookie).send(roleAssignment).expect(201);

    const userRoleRecord = await prisma.spaceRoleToRole.count({
      where: {
        roleId: role.id,
        spaceRole: {
          userId: extraUser.id
        }
      }
    });
    expect(userRoleRecord).toBe(1);
  });

  it('should fail if the requesting user is not a space admin, and respond 401', async () => {
    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);
    const extraUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const role = await generateRole({
      createdBy: nonAdminUser.id,
      spaceId: space.id
    });

    const roleAssignment: RoleAssignment = {
      roleId: role.id,
      userId: extraUser.id
    };

    const nonAdminCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl).post('/api/roles/assignment').set('Cookie', nonAdminCookie).send(roleAssignment).expect(401);
  });
});

describe('DELETE /api/roles/assignment - Unassign a user from a role', () => {
  it('should succeed if the requesting user is a space admin, and respond 200', async () => {
    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);
    const extraUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const role = await generateRole({
      createdBy: adminUser.id,
      spaceId: space.id
    });

    const roleAssignment: RoleAssignment = {
      roleId: role.id,
      userId: extraUser.id
    };

    await assignRole(roleAssignment);

    const adminCookie = await loginUser(adminUser.id);

    await request(baseUrl).delete('/api/roles/assignment').set('Cookie', adminCookie).send(roleAssignment).expect(200);
    const userRoleRecord = await prisma.spaceRoleToRole.count({
      where: {
        roleId: role.id,
        spaceRole: {
          userId: extraUser.id
        }
      }
    });
    expect(userRoleRecord).toBe(0);
  });

  it('should fail if the requesting user is not a space admin, and respond 401', async () => {
    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);
    const extraUser = await generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const role = await generateRole({
      createdBy: nonAdminUser.id,
      spaceId: space.id
    });

    const roleAssignment: RoleAssignment = {
      roleId: role.id,
      userId: extraUser.id
    };

    const nonAdminCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl)
      .delete('/api/roles/assignment')
      .set('Cookie', nonAdminCookie)
      .send(roleAssignment)
      .expect(401);
  });
});
