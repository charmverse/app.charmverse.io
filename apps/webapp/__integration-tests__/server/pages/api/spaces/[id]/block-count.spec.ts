/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

let spaceOneUser: User;
let spaceOne: Space;

let spaceTwoAdmin: User;

beforeAll(async () => {
  const generated1 = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
  spaceOneUser = generated1.user;
  spaceOne = generated1.space;

  const generated2 = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  spaceTwoAdmin = generated2.user;

  await prisma.blockCount.create({
    data: {
      count: 20,
      details: {},
      createdAt: new Date(),
      space: { connect: { id: spaceOne.id } }
    }
  });
});

describe('GET /api/spaces/[id]/block count - Get space block count', () => {
  it('should return the block count for space members', async () => {
    const memberCookie = await loginUser(spaceOneUser.id);

    const blockCount = (
      await request(baseUrl).get(`/api/spaces/${spaceOne.id}/block-count`).set('Cookie', memberCookie).expect(200)
    ).body as { count: number; additionalQuota: number };

    expect(blockCount).toMatchObject<{ count: number; additionalQuota: number }>({
      count: expect.any(Number),
      additionalQuota: expect.any(Number)
    });
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    const outsideUsernCookie = await loginUser(spaceTwoAdmin.id);
    await request(baseUrl).get(`/api/spaces/${spaceOne.id}/block-count`).set('Cookie', outsideUsernCookie).expect(401);
  });
});
