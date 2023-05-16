import type { Page, ProposalCategory, Space, Vote } from '@charmverse/core/prisma';
import { SpaceOperation } from '@charmverse/core/prisma';
import request from 'supertest';
import { v4 } from 'uuid';

import { removeSpaceOperations } from 'lib/permissions/spaces';
import { createProposal } from 'lib/proposal/createProposal';
import { typedKeys } from 'lib/utilities/objects';
import type { VoteDTO } from 'lib/votes/interfaces';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { createPage, createVote, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateProposal, generateProposalCategory } from 'testing/utils/proposals';

let page: Page;
let space: Space;
let user: LoggedInUser;
let vote: Vote;
let proposalCategory: ProposalCategory;

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

  vote = await createVote({
    createdBy: user.id,
    pageId: page.id,
    spaceId: space.id
  });

  userCookie = await loginUser(user.id);
  proposalCategory = await generateProposalCategory({
    spaceId: space.id
  });
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
      description: '',
      context: 'inline',
      spaceId: pageForVote.spaceId,
      pageId: pageForVote.id,
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3'],
      createdBy: user.id
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
      description: '',
      context: 'inline',
      createdBy: nonAdminUser.id,
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3']
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
      description: '',
      createdBy: user.id,
      context: 'inline',
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3']
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
      description: '',
      createdBy: user2.id,
      context: 'inline',
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3']
    };

    await request(baseUrl).post('/api/votes').set('Cookie', userCookie).send(newVote).expect(401);
  });
});

describe('POST /api/votes - Create a proposal vote', () => {
  it('should allow the user to create a proposal vote if they are a proposal author', async () => {
    const { user: author, space: authorSpace } = await generateUserAndSpaceWithApiToken(undefined, false);

    const authorCookie = await loginUser(author.id);

    const proposal = await generateProposal({
      userId: author.id,
      spaceId: authorSpace.id,
      proposalStatus: 'reviewed',
      categoryId: proposalCategory.id
    });

    const newVote: VoteDTO = {
      context: 'proposal',
      deadline: new Date(),
      description: '',
      pageId: proposal.id,
      spaceId: proposal.spaceId,
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3'],
      createdBy: user.id
    };

    await request(baseUrl).post('/api/votes').set('Cookie', authorCookie).send(newVote).expect(201);
  });

  it('should allow the user to create a proposal vote if they are a space admin who did not author the proposal', async () => {
    const { user: author, space: authorSpace } = await generateUserAndSpaceWithApiToken(undefined, false);
    const adminUser = await generateSpaceUser({ spaceId: authorSpace.id, isAdmin: true });
    const adminCookie = await loginUser(adminUser.id);

    const proposal = await generateProposal({
      userId: author.id,
      spaceId: authorSpace.id,
      proposalStatus: 'reviewed',
      categoryId: proposalCategory.id
    });
    const newVote: VoteDTO = {
      context: 'proposal',
      deadline: new Date(),
      pageId: proposal.id,
      description: '',
      spaceId: proposal.spaceId,
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3'],
      createdBy: user.id
    };
    await request(baseUrl).post('/api/votes').set('Cookie', adminCookie).send(newVote).expect(201);
  });

  it('should not allow the user to create a proposal vote if they are not a proposal author', async () => {
    const { user: author, space: authorSpace } = await generateUserAndSpaceWithApiToken(undefined, false);
    const otherUser = await generateSpaceUser({ isAdmin: false, spaceId: authorSpace.id });
    const otherUserCookie = await loginUser(otherUser.id);

    await removeSpaceOperations({
      forSpaceId: authorSpace.id,
      operations: typedKeys(SpaceOperation),
      spaceId: authorSpace.id
    });

    const { page: resultPage } = await createProposal({
      userId: author.id,
      spaceId: authorSpace.id,
      categoryId: proposalCategory.id
    });
    const newVote: VoteDTO = {
      deadline: new Date(),
      pageId: resultPage.id,
      spaceId: resultPage.spaceId,
      context: 'inline',
      description: '',
      title: 'new vote',
      type: 'Approval',
      threshold: 50,
      voteOptions: ['1', '2', '3'],
      createdBy: user.id
    };

    await request(baseUrl).post('/api/votes').set('Cookie', otherUserCookie).send(newVote).expect(401);
  });
});
