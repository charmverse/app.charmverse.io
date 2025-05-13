/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Role, Space, User } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

describe('POST /api/roles - Create a role', () => {
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

  it('should succeed if the requesting user is a space admin, and respond 201', async () => {
    const roleData: Pick<Role, 'name' | 'spaceId'> = {
      name: `Role 1 - ${uuid()}`,
      spaceId: space.id
    };

    const adminCookie = await loginUser(adminUser.id);

    const createdRole = (
      await request(baseUrl).post('/api/roles').set('Cookie', adminCookie).send(roleData).expect(201)
    ).body as Role;

    expect(createdRole).toMatchObject(roleData);
  });

  it('should fail if the requesting user is not a space admin, and respond 401', async () => {
    const roleData: Pick<Role, 'name' | 'spaceId'> = {
      name: `Role 2 - ${uuid()}`,
      spaceId: space.id
    };

    const nonAdminCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl).post('/api/roles').set('Cookie', nonAdminCookie).send(roleData).expect(401);
  });
});
