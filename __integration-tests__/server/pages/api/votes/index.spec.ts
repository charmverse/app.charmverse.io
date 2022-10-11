import type { Page, Space, Vote } from '@prisma/client';
import { SpaceOperation } from '@prisma/client';
import request from 'supertest';
import { v4 } from 'uuid';

import { removeSpaceOperations } from 'lib/permissions/spaces';
import { createProposal } from 'lib/proposal/createProposal';
import { typedKeys } from 'lib/utilities/objects';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { createPage, createVote, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let page: Page;
let space: Space;
let user: LoggedInUser;
let vote: Vote;

let userCookie: string;

beforeAll(async () => {
  const { space: generatedSpace, user: generatedUser } = await generateUserAndSpaceWithApiToken(undefined, false);
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

  userCookie = await loginUser(user.id);
});

describe('GET /api/votes?id={id} - Get an individual vote', () => {
  it('Should return the vote if it exist and respond 200', async () => {
    await request(baseUrl).get(`/api/votes?id=${vote.id}`).set('Cookie', userCookie).expect(200);
  });

  it('Should fail if the vote doesn\'t exist and respond 404', async () => {
    await request(baseUrl).get(`/api/votes?id=${v4()}`).set('Cookie', userCookie).expect(404);
  });
});

describe('POST /api/votes - Create a new poll', () => {
  it('Should create the poll if the user has the create poll permission for the page and respond 201', async () => {

    const pageForVote = await createPage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [{
        permissionLevel: 'custom',
        permissions: ['create_poll'],
        userId: user.id
      }]
    });

    await request(baseUrl).post('/api/votes').set('Cookie', userCookie).send({
      deadline: new Date(),
      pageId: pageForVote.id,
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3'],
      createdBy: user.id
    })
      .expect(201);
  });

  it('Should create the poll if the user is an admin for the page and respond 201', async () => {

    const nonAdminUser = await generateSpaceUser({ spaceId: space.id, isAdmin: true });
    const nonAdminUserCookie = await loginUser(nonAdminUser.id);

    const pageForVote = await createPage({
      createdBy: nonAdminUser.id,
      spaceId: space.id
    });

    await request(baseUrl).post('/api/votes').set('Cookie', nonAdminUserCookie).send({
      deadline: new Date(),
      pageId: pageForVote.id,
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3'],
      createdBy: nonAdminUser.id
    })
      .expect(201);
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

describe('POST /api/votes - Create a proposal vote', () => {
  it('should allow the user to create a proposal vote if they are a proposal author', async () => {

    const { user: author, space: authorSpace } = await generateUserAndSpaceWithApiToken(undefined, false);

    await removeSpaceOperations({ forSpaceId: authorSpace.id, operations: typedKeys(SpaceOperation), spaceId: authorSpace.id });

    const authorCookie = await loginUser(author.id);

    const { page: resultPage } = await createProposal({
      createdBy: author.id,
      spaceId: authorSpace.id,
      title: 'page-title'
    });

    await request(baseUrl)
      .post('/api/votes')
      .set('Cookie', authorCookie).send({
        context: 'proposal',
        deadline: new Date(),
        pageId: resultPage.id,
        title: 'new vote',
        type: 'Approval',
        threshold: 50,
        voteOptions: ['1', '2', '3'],
        createdBy: user.id
      })
      .expect(201);

  });

  it('should allow the user to create a proposal vote if they are a space admin who did not author the proposal', async () => {

    const { user: author, space: authorSpace } = await generateUserAndSpaceWithApiToken(undefined, false);
    const adminUser = await generateSpaceUser({ spaceId: authorSpace.id, isAdmin: true });

    await removeSpaceOperations({ forSpaceId: authorSpace.id, operations: typedKeys(SpaceOperation), spaceId: authorSpace.id });

    const adminCookie = await loginUser(adminUser.id);

    const { page: resultPage } = await createProposal({
      createdBy: author.id,
      spaceId: authorSpace.id
    });

    await request(baseUrl)
      .post('/api/votes')
      .set('Cookie', adminCookie).send({
        context: 'proposal',
        deadline: new Date(),
        pageId: resultPage.id,
        title: 'new vote',
        type: 'Approval',
        threshold: 50,
        voteOptions: ['1', '2', '3'],
        createdBy: user.id
      })
      .expect(201);
  });

  it('should not allow the user to create a proposal vote if they are not a proposal author', async () => {

    const { user: author, space: authorSpace } = await generateUserAndSpaceWithApiToken(undefined, false);
    const otherUser = await generateSpaceUser({ isAdmin: false, spaceId: authorSpace.id });
    const otherUserCookie = await loginUser(otherUser.id);

    await removeSpaceOperations({ forSpaceId: authorSpace.id, operations: typedKeys(SpaceOperation), spaceId: authorSpace.id });

    const { page: resultPage } = await createProposal({
      createdBy: author.id,
      spaceId: authorSpace.id
    });

    await request(baseUrl).post('/api/votes').set('Cookie', otherUserCookie).send({
      deadline: new Date(),
      pageId: resultPage.id,
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3'],
      createdBy: user.id
    })
      .expect(401);
  });

});
