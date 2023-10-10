/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import type { SpacePublicProposalToggle } from 'lib/spaces/toggleSpacePublicProposals';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser } from 'testing/setupDatabase';

let nonAdminUser: User;
let nonAdminUserCookie: string;
let adminUser: User;
let adminUserCookie: string;
let space: Space;

beforeAll(async () => {
  const { space: generatedSpace, user } = await testUtilsUser.generateUserAndSpace({
    isAdmin: false,
    spacePaidTier: 'free'
  });

  space = generatedSpace;
  nonAdminUser = user;
  adminUser = await generateSpaceUser({
    isAdmin: true,
    spaceId: space.id
  });

  nonAdminUserCookie = await loginUser(nonAdminUser.id);
  adminUserCookie = await loginUser(adminUser.id);
});

describe('POST /api/spaces/[id]/switch-to-free-tier - Use free Public Goods plan', () => {
  it('should update a space`s paid tier, if user is the admin and return the space, responding with 200', async () => {
    const update: Pick<SpacePublicProposalToggle, 'publicProposals'> = {
      publicProposals: true
    };
    await request(baseUrl)
      .post(`/api/spaces/${space.id}/switch-to-free-tier`)
      .set('Cookie', adminUserCookie)
      .send(update)
      .expect(200);
    const updatedSpace = await prisma.space.findUniqueOrThrow({ where: { id: space.id } });

    expect(updatedSpace.paidTier).toBe('free');
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    await request(baseUrl)
      .post(`/api/spaces/${space.id}/switch-to-free-tier`)
      .set('Cookie', nonAdminUserCookie)
      .send({
        publicProposals: true
      })
      .expect(401);
  });
});
