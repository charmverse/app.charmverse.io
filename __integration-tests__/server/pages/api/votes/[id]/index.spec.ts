import { createPage, createVote, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { Page, Space, User, Vote } from '@prisma/client';
import { v4 } from 'uuid';

let page: Page;
let space: Space;
let user: User;
let vote: Vote;

let userCookie: string;

beforeAll(async () => {
  const { space: generatedSpace, user: generatedUser } = await generateUserAndSpaceWithApiToken(undefined, true);
  user = generatedUser;
  space = generatedSpace;

  page = await createPage({
    createdBy: user.id,
    spaceId: space.id
  });

  vote = await createVote({
    createdBy: user.id,
    pageId: page.id,
    spaceId: space.id,
    voteOptions: ['3', '4'],
    userVotes: ['3']
  });

  userCookie = await loginUser(user);
});

describe('GET /api/votes/[id] - Get a single vote', () => {
  it('Should get vote and respond 200', async () => {
    await request(baseUrl).get(`/api/votes/${vote.id}`).set('Cookie', userCookie).expect(200);
  });

  it('Should fail if vote doesn\'t exist and respond 404', async () => {
    await request(baseUrl).get(`/api/votes/${v4()}`).set('Cookie', userCookie).expect(404);
  });
});

describe('PUT /api/votes/[id] - Update a single vote', () => {
  it('Should update vote and respond 200', async () => {
    await request(baseUrl).put(`/api/votes/${vote.id}`).set('Cookie', userCookie).send({
      status: 'Cancelled'
    })
      .expect(200);
  });
});

describe('DELETE /api/votes/[id] - Delete a single vote', () => {
  it('Should delete update vote and respond 200', async () => {
    await request(baseUrl).delete(`/api/votes/${vote.id}`).set('Cookie', userCookie).send()
      .expect(200);
  });
});
