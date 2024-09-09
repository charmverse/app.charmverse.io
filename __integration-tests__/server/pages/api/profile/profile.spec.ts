import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import request from 'supertest';
import { v4 } from 'uuid';

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
  it('should allow the user to set a Google Account as their username, responding with 200', async () => {
    const googleAccount = await prisma.googleAccount.create({
      data: {
        email: `acc-${v4()}@google.com`,
        name: `test name`,
        avatarUrl: `https://example.com/photourl.png`,
        user: {
          connect: {
            id: user.id
          }
        }
      }
    });

    const update: Partial<LoggedInUser> = {
      identityType: 'Google',
      username: googleAccount.name
    };

    const updatedProfile = (
      await request(baseUrl).put('/api/profile').set('Cookie', userCookie).send(update).expect(200)
    ).body as LoggedInUser;

    expect(updatedProfile.username).toBe(googleAccount.name);
    expect(updatedProfile.identityType).toBe('Google');
  });

  it('should refuse to update a users profile to a Google Account not registered to their account, responding with 401', async () => {
    const extraUser = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

    const update: Partial<LoggedInUser> = {
      identityType: 'Google',
      username: 'wrongemail@google.com'
    };

    const cookie = await loginUser(extraUser.id);

    await request(baseUrl).put('/api/profile').set('Cookie', cookie).send(update).expect(401);
  });
});
