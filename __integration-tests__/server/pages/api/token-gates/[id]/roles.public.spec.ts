import type { Role, Space, TokenGate, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

// User 1 is admin
let adminUser: User;
let space: Space;
let role: Role;
let tokenGate: TokenGate;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true, spacePaidTier: 'free' });

  space = generated.space;
  adminUser = generated.user;

  role = await testUtilsMembers.generateRole({
    createdBy: adminUser.id,
    spaceId: space.id
  });

  tokenGate = await prisma.tokenGate.create({
    data: {
      conditions: {},
      createdBy: adminUser.id,
      tokenGateToRoles: {
        create: {
          roleId: role.id
        }
      },
      type: 'lit',
      resourceId: {},
      space: {
        connect: {
          id: space.id
        }
      }
    }
  });
});

describe('PUT /token-gates/{tokenGateId}/roles- assign roles to token gate in a free space', () => {
  it('Should fail for free spaces, responding with 402', async () => {
    const adminCookie = await loginUser(adminUser.id);
    await request(baseUrl)
      .put(`/api/token-gates/${tokenGate.id}/roles`)
      .set('Cookie', adminCookie)
      .send({ spaceId: space.id, roleIds: [role.id] })
      .expect(402);
  });
});
