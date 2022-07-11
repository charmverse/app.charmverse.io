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
    spaceId: space.id
  });

  userCookie = await loginUser(user);
});

describe('GET /api/votes?id={id} - Get an individual vote', () => {
  it('Should return the vote if it exist and respond 200', async () => {
    await request(baseUrl).get(`/api/votes?id=${vote.id}`).set('Cookie', userCookie).expect(200);
  });

  it('Should fail if the vote doesn\'t exist and respond 404', async () => {
    await request(baseUrl).get(`/api/votes?id=${v4()}`).set('Cookie', userCookie).expect(404);
  });
});

describe('POST /api/votes - Create a new vote', () => {
  it('Should create the vote respond 200', async () => {
    await request(baseUrl).post('/api/votes').set('Cookie', userCookie).send({
      deadline: new Date(),
      pageId: page.id,
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3']
    })
      .expect(200);
  });

  it('Should fail if the vote body doesn\'t have correct fields and respond 400', async () => {
    await request(baseUrl).post(`/api/votes?id=${v4()}`).set('Cookie', userCookie).send({})
      .expect(400);
  });
});
