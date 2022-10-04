import type { Page, Space, Vote } from '@prisma/client';
import request from 'supertest';
import { v4 } from 'uuid';

import { baseUrl, loginUser } from 'testing/mockApiCall';
import { createPage, createVote, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let page1: Page;
let page2: Page;
let space1: Space;
let space2: Space;
let cancelledVote: Vote;
let inProgressVote: Vote;
let space2Vote: Vote;

let userCookie: string;

beforeAll(async () => {
  const { space: generatedSpace1, user: generatedUser1 } = await generateUserAndSpaceWithApiToken(undefined, true);
  const { space: generatedSpace2, user: generatedUser2 } = await generateUserAndSpaceWithApiToken(undefined, true);
  space1 = generatedSpace1;
  space2 = generatedSpace2;

  page1 = await createPage({
    createdBy: generatedUser1.id,
    spaceId: space1.id
  });

  page2 = await createPage({
    createdBy: generatedUser2.id,
    spaceId: space1.id
  });

  cancelledVote = await createVote({
    createdBy: generatedUser1.id,
    pageId: page1.id,
    spaceId: space1.id,
    status: 'Cancelled',
    voteOptions: ['3', '4']
  });

  inProgressVote = await createVote({
    createdBy: generatedUser1.id,
    pageId: page1.id,
    spaceId: space1.id,
    voteOptions: ['1', '2']
  });

  space2Vote = await createVote({
    createdBy: generatedUser1.id,
    pageId: page2.id,
    spaceId: space2.id,
    voteOptions: ['1', '2']
  });

  userCookie = await loginUser(generatedUser1.id);
});

describe('POST /api/votes/[id]/cast - Cast a vote using one of the provided options', () => {
  it('Should cast vote and respond 200', async () => {
    await request(baseUrl).post(`/api/votes/${inProgressVote.id}/cast`).set('Cookie', userCookie).send({
      choice: '1'
    })
      .expect(200);
  });

  it('Should fail if the body doesn\'t have correct fields and respond 400', async () => {
    await request(baseUrl).post(`/api/votes/${inProgressVote.id}/cast`).set('Cookie', userCookie).send({})
      .expect(400);
  });

  it('Should fail if the vote doesn\'t exist and respond 404', async () => {
    await request(baseUrl).post(`/api/votes/${v4()}/cast`).set('Cookie', userCookie).send({
      choice: '3'
    })
      .expect(404);
  });

  it('Should fail if the vote has been cancelled and respond 400', async () => {
    await request(baseUrl).post(`/api/votes/${cancelledVote.id}/cast`).set('Cookie', userCookie).send({
      choice: '3'
    })
      .expect(400);
  });

  it('Should fail if the user choice is not included in vote\'s options and respond 400', async () => {
    await request(baseUrl).post(`/api/votes/${inProgressVote.id}/cast`).set('Cookie', userCookie).send({
      choice: v4()
    })
      .expect(400);
  });

  it('Should fail if the user don\'t have access to the space the page of the vote is part of and respond 401', async () => {
    await request(baseUrl).post(`/api/votes/${space2Vote.id}/cast`).set('Cookie', userCookie).send({
      choice: ['1']
    })
      .expect(401);
  });
});
