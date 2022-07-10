import { createPage, createVote, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { Page, Space, User, Vote } from '@prisma/client';
import { v4 } from 'uuid';

let page1: Page;
let page2: Page;
let space1: Space;
let space2: Space;
let user1: User;
let user2: User;
let vote1: Vote;

let user1Cookie: string;

beforeAll(async () => {
  const { space: generatedSpace1, user: generatedUser1 } = await generateUserAndSpaceWithApiToken(undefined, true);
  const { space: generatedSpace2, user: generatedUser2 } = await generateUserAndSpaceWithApiToken(undefined, true);
  user1 = generatedUser1;
  user2 = generatedUser2;
  space1 = generatedSpace1;
  space2 = generatedSpace2;

  page1 = await createPage({
    createdBy: user1.id,
    spaceId: space1.id
  });

  page2 = await createPage({
    createdBy: user2.id,
    spaceId: space2.id
  });

  vote1 = await createVote({
    createdBy: user1.id,
    pageId: page1.id,
    spaceId: space1.id
  });

  user1Cookie = await loginUser(user1);
});

describe('GET /api/votes?id={id}', () => {
  it('Should return the vote if the vote exist and respond 200', async () => {
    await request(baseUrl).get(`/api/votes?id=${vote1.id}`).set('Cookie', user1Cookie).expect(200);
  });

  it('Should fail if the vote doesn\'t exist and respond 404', async () => {
    await request(baseUrl).get(`/api/votes?id=${v4()}`).set('Cookie', user1Cookie).expect(404);
  });
});

describe('POST /api/votes', () => {
  it('Should create the vote respond 200', async () => {
    await request(baseUrl).post('/api/votes').set('Cookie', user1Cookie).send({
      deadline: new Date(),
      pageId: page1.id,
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3']
    })
      .expect(200);
  });

  it('Should fail if the vote body doesn\'t have correct fields and respond 400', async () => {
    await request(baseUrl).post(`/api/votes?id=${v4()}`).set('Cookie', user1Cookie).send({})
      .expect(400);
  });
});
