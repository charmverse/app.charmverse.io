import type { Page, Space, User, Vote } from '@prisma/client';
import { addSpaceOperations } from 'lib/permissions/spaces';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { createPage, createVote, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
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
      voteOptions: ['1', '2', '3'],
      createdBy: user.id
    })
      .expect(200);
  });

  it('Should fail if the vote body doesn\'t have correct fields and respond 400', async () => {
    await request(baseUrl).post('/api/votes').set('Cookie', userCookie).send({})
      .expect(400);
  });

  it('should throw error if page vote is created on doesn\'t exist', async () => {
    await request(baseUrl).post('/api/votes').set('Cookie', userCookie).send({
      deadline: new Date(),
      pageId: v4(),
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3']
    })
      .expect(404);
  });

  it('should throw error if user don\'t have permission to create vote', async () => {
    const { space: space2, user: user2 } = await generateUserAndSpaceWithApiToken(undefined, false);

    const page2 = await createPage({
      createdBy: user2.id,
      spaceId: space2.id
    });

    await request(baseUrl).post('/api/votes').set('Cookie', userCookie).send({
      deadline: new Date(),
      pageId: page2.id,
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3']
    })
      .expect(401);
  });
});
