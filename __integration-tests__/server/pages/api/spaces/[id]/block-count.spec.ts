/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import type { BlockCountInfo } from 'lib/spaces/getSpaceBlockCount';
import { baseUrl, loginUser } from 'testing/mockApiCall';

let spaceOneUser: User;
let spaceOne: Space;

let spaceTwoAdmin: User;
let spaceTwo: Space;

beforeAll(async () => {
  const generated1 = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
  spaceOneUser = generated1.user;
  spaceOne = generated1.space;

  const generated2 = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  spaceTwoAdmin = generated2.user;
  spaceTwo = generated2.space;

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
    ).body as BlockCountInfo;

    expect(blockCount).toMatchObject<BlockCountInfo>({
      count: expect.any(Number),
      createdAt: expect.any(String),
      details: expect.any(Object)
    });
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    const outsideUsernCookie = await loginUser(spaceTwoAdmin.id);
    const blockCount = (
      await request(baseUrl).get(`/api/spaces/${spaceOne.id}/block-count`).set('Cookie', outsideUsernCookie).expect(401)
    ).body as BlockCountInfo;
  });
});
