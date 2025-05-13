/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Role, Space, User } from '@charmverse/core/prisma';
import { testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

describe('POST /api/roles - Create a role in free spaces', () => {
  let space: Space;
  let adminUser: User;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'free'
    });
    space = generated.space;
    adminUser = generated.user;
  });

  it('should fail for free spaces,and respond 402', async () => {
    const roleData: Pick<Role, 'name' | 'spaceId'> = {
      name: `Role 1 - ${uuid()}`,
      spaceId: space.id
    };

    const adminCookie = await loginUser(adminUser.id);
    await request(baseUrl).post('/api/roles').set('Cookie', adminCookie).send(roleData).expect(402);
  });
});
