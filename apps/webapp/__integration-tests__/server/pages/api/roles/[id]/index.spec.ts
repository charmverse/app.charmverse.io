/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Role, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';
import { v4 as uuid, v4 } from 'uuid';

import type { RoleAssignment } from '@packages/lib/roles';

describe('PUT /api/roles/[id] - Update a role', () => {
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

  it('should succeed if the requesting user is a space admin, only updating the role name, and respond 200', async () => {
    const adminCookie = await loginUser(adminUser.id);

    const newName = `New Role Name - ${uuid()}`;

    const updatedRole = (
      await request(baseUrl)
        .put(`/api/roles/${role.id}`)
        .set('Cookie', adminCookie)
        .send({
          name: newName,
          // This update should not be applied
          spaceId: v4()
        })
        .expect(200)
    ).body;

    expect(updatedRole).toMatchObject(
      expect.objectContaining({
        spaceId: space.id,
        name: newName
      })
    );
  });

  it('should fail if the requesting user is not a space admin, and respond 401', async () => {
    const nonAdminCookie = await loginUser(nonAdminUser.id);

    const newName = `New Role Name - ${uuid()}`;

    await request(baseUrl)
      .put(`/api/roles/${role.id}`)
      .set('Cookie', nonAdminCookie)
      .send({ name: newName })
      .expect(401);
  });
});

describe('DELETE /api/roles/[id] - Delete a role', () => {
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
    const adminCookie = await loginUser(adminUser.id);

    await request(baseUrl).delete(`/api/roles/${role.id}`).set('Cookie', adminCookie).expect(200);
    const roleAfterDelete = await prisma.role.findUnique({
      where: {
        id: role.id
      }
    });
    expect(roleAfterDelete).toBeNull();
  });

  it('should fail if the requesting user is not a space admin, and respond 401', async () => {
    const role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [nonAdminUser.id]
    });
    const userCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl).delete(`/api/roles/${role.id}`).set('Cookie', userCookie).expect(401);
  });
});
