import { Space, User } from '@prisma/client';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { v4 } from 'uuid';

let space: Space;
let user: User;

let userCookie: string;

beforeAll(async () => {
  const { space: generatedSpace, user: generatedUser } = await generateUserAndSpaceWithApiToken(undefined, true);
  user = generatedUser;
  space = generatedSpace;
  userCookie = await loginUser(user);
});

describe('GET /api/spaces/[id]/votes - Get all the votes for a specific space', () => {
  it('Should get all votes for space and respond 200', async () => {
    await request(baseUrl).get(`/api/spaces/${space.id}/votes`).set('Cookie', userCookie).expect(200);
  });

  it('Should fail if user is not a part of the space and respond with 401', async () => {
    await request(baseUrl).get(`/api/spaces/${v4()}/votes`).set('Cookie', userCookie).expect(401);
  });
});
