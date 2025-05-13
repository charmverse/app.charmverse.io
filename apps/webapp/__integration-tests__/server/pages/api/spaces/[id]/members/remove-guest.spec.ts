/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import {
  generateSpaceUser,
  generateUserAndSpace,
  generateUserAndSpaceWithApiToken
} from '@packages/testing/setupDatabase';
import request from 'supertest';

let space: Space;
let adminUser: User;
let normalUser: User;

beforeAll(async () => {
  const generated = await generateUserAndSpace({
    isAdmin: true
  });

  space = generated.space;
  adminUser = generated.user;

  normalUser = await generateSpaceUser({
    spaceId: space.id,
    isAdmin: false
  });
});

describe('DELETE /api/spaces/[id]/members/[userId] - Remove guest user', () => {
  it('should remove the user if the requester is admin, responding with 200', async () => {
    const guest = await generateSpaceUser({
      spaceId: space.id,
      isGuest: true
    });

    const userCookie = await loginUser(adminUser.id);

    await request(baseUrl).delete(`/api/spaces/${space.id}/members/${guest.id}`).set('Cookie', userCookie).expect(200);

    // Make sure it actually did something
    const spaceRoles = await prisma.spaceRole.findMany({
      where: {
        spaceId: space.id
      }
    });

    expect(spaceRoles).toHaveLength(2);

    expect(spaceRoles.some((sr) => sr.userId === adminUser.id)).toBe(true);
    expect(spaceRoles.some((sr) => sr.userId === normalUser.id)).toBe(true);
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    const guest = await generateSpaceUser({
      spaceId: space.id,
      isGuest: true
    });

    const userCookie = await loginUser(normalUser.id);

    await request(baseUrl).delete(`/api/spaces/${space.id}/members/${guest.id}`).set('Cookie', userCookie).expect(401);
  });
});
