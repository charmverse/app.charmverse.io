import type { Space } from '@prisma/client';
import request from 'supertest';

import { prisma } from 'db';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let space: Space;
let user: LoggedInUser;
let userCookie: string;

beforeAll(async () => {
  const { user: generatedUser, space: generatedSpace } = await generateUserAndSpaceWithApiToken(undefined, true);
  space = generatedSpace;
  user = generatedUser;
  userCookie = await loginUser(user.id);
});

describe('PUT /api/profile - Update user profile', () => {
  it('should allow the user to set an unstoppable domain as their username, responding with 200', async () => {
    const domain = await prisma.unstoppableDomain.create({
      data: {
        domain: 'test-domain',
        user: {
          connect: {
            id: user.id
          }
        }
      }
    });

    const update: Partial<LoggedInUser> = {
      identityType: 'UnstoppableDomain',
      username: domain.domain
    };

    const updatedProfile = (
      await request(baseUrl).put('/api/profile').set('Cookie', userCookie).send(update).expect(200)
    ).body as LoggedInUser;

    expect(updatedProfile.username).toBe(domain.domain);
    expect(updatedProfile.identityType).toBe('UnstoppableDomain');
  });

  it('should refuse to update a users profile to an unstoppable domain not registered to their account, responding with 401', async () => {
    const extraUser = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

    const update: Partial<LoggedInUser> = {
      identityType: 'UnstoppableDomain',
      username: 'userdomain.nft'
    };

    const cookie = await loginUser(extraUser.id);

    await request(baseUrl).put('/api/profile').set('Cookie', cookie).send(update).expect(401);
  });
});
