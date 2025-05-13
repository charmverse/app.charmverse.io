import type { Page, Space } from '@charmverse/core/prisma';
import type { LoggedInUser } from '@packages/profile/getUser';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { createPage, generateSpaceUser, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import request from 'supertest';
import { v4 } from 'uuid';

import type { VoteDTO } from '@packages/lib/votes/interfaces';

let page: Page;
let space: Space;
let user: LoggedInUser;

let userCookie: string;

beforeAll(async () => {
  const { space: generatedSpace, user: generatedUser } = await generateUserAndSpaceWithApiToken(undefined, false);
  user = generatedUser;
  space = generatedSpace;

  page = await createPage({
    createdBy: user.id,
    spaceId: space.id,
    pagePermissions: [
      {
        permissionLevel: 'full_access',
        userId: user.id
      }
    ]
  });

  userCookie = await loginUser(user.id);
});

describe('GET /api/votes?id={id} - Get an individual vote', () => {
  it('Should 400 when missing parameters', async () => {
    await request(baseUrl).get(`/api/votes`).set('Cookie', userCookie).expect(400);
  });

  it('Should return the vote if it exist and respond 200', async () => {
    await request(baseUrl).get(`/api/votes?pageId=${page.id}`).set('Cookie', userCookie).expect(200);
  });

  it("Should fail if the vote doesn't exist and respond 404", async () => {
    await request(baseUrl).get(`/api/votes?pageId=${v4()}`).set('Cookie', userCookie).expect(404);
  });
});

describe('POST /api/votes - Create a new poll', () => {
  it('Should create the poll if the user has the create poll permission for the page and respond 201', async () => {
    const pageForVote = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'custom',
          permissions: ['create_poll'],
          userId: user.id
        }
      ]
    });
    const newVote: VoteDTO = {
      deadline: new Date(),
      content: null,
      contentText: '',
      context: 'inline',
      spaceId: pageForVote.spaceId,
      pageId: pageForVote.id,
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3'],
      createdBy: user.id,
      maxChoices: 1,
      strategy: 'regular'
    };

    await request(baseUrl).post('/api/votes').set('Cookie', userCookie).send(newVote).expect(201);
  });

  it('Should create the poll if the user is an admin for the page and respond 201', async () => {
    const nonAdminUser = await generateSpaceUser({ spaceId: space.id, isAdmin: true });
    const nonAdminUserCookie = await loginUser(nonAdminUser.id);

    const pageForVote = await createPage({
      createdBy: nonAdminUser.id,
      spaceId: space.id
    });
    const newVote: VoteDTO = {
      deadline: new Date(),
      pageId: pageForVote.id,
      spaceId: space.id,
      content: null,
      contentText: '',
      context: 'inline',
      createdBy: nonAdminUser.id,
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3'],
      maxChoices: 1,
      strategy: 'regular'
    };

    await request(baseUrl).post('/api/votes').set('Cookie', nonAdminUserCookie).send(newVote).expect(201);
  });

  it("Should fail if the vote body doesn't have correct fields and respond 400", async () => {
    await request(baseUrl).post('/api/votes').set('Cookie', userCookie).send({}).expect(400);
  });

  it("should throw error if page vote is created on doesn't exist", async () => {
    const newVote: VoteDTO = {
      deadline: new Date(),
      pageId: v4(),
      spaceId: space.id,
      content: null,
      contentText: '',
      createdBy: user.id,
      context: 'inline',
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3'],
      maxChoices: 1,
      strategy: 'regular'
    };
    await request(baseUrl).post('/api/votes').set('Cookie', userCookie).send(newVote).expect(404);
  });

  it("should throw error if user don't have permission to create vote", async () => {
    const { space: space2, user: user2 } = await generateUserAndSpaceWithApiToken(undefined, false);

    const page2 = await createPage({
      createdBy: user2.id,
      spaceId: space2.id
    });
    const newVote: VoteDTO = {
      deadline: new Date(),
      pageId: page2.id,
      spaceId: space2.id,
      content: null,
      contentText: '',
      createdBy: user2.id,
      context: 'inline',
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3'],
      maxChoices: 1,
      strategy: 'regular'
    };

    await request(baseUrl).post('/api/votes').set('Cookie', userCookie).send(newVote).expect(401);
  });
});
