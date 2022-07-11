import { createPage, createVote, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { Page, Space, User, Vote } from '@prisma/client';

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
    voteOptions: ['3', '4']
  });

  userCookie = await loginUser(user);
});

describe('POST /api/votes/[id]/cast - Cast a vote using one of the provided options', () => {
  it('Should cast vote and respond 200', async () => {
    await request(baseUrl).post(`/api/votes/${vote.id}/cast`).set('Cookie', userCookie).send({
      choice: '3'
    })
      .expect(200);
  });

  it('Should fail if the body doesn\'t have correct fields and respond 400', async () => {
    await request(baseUrl).post(`/api/votes/${vote.id}/cast`).set('Cookie', userCookie).send({})
      .expect(400);
  });
});
