/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Role, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';
import { v4 as uuid, v4 } from 'uuid';

import type { RoleAssignment } from '@packages/lib/roles';

describe('PUT /api/roles/[id] - Update a role in free spaces', () => {
  let space: Space;
  let adminUser: User;
  let role: Role;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'free'
    });
    space = generated.space;
    adminUser = generated.user;
    role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id
    });
  });

  it('should fail for free spaces, and respond 402', async () => {
    const adminCookie = await loginUser(adminUser.id);

    const newName = `New Role Name - ${uuid()}`;

    await request(baseUrl)
      .put(`/api/roles/${role.id}`)
      .set('Cookie', adminCookie)
      .send({
        name: newName,
        // This update should not be applied
        spaceId: v4()
      })
      .expect(402);
  });
});

describe('DELETE /api/roles/[id] - Delete a role in free spaces', () => {
  let space: Space;
  let adminUser: User;
  let role: Role;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'free'
    });
    space = generated.space;
    adminUser = generated.user;
    role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id
    });
  });
  it('should fail for free spaces, and respond 402', async () => {
    const adminCookie = await loginUser(adminUser.id);

    await request(baseUrl).delete(`/api/roles/${role.id}`).set('Cookie', adminCookie).expect(402);
  });
});
