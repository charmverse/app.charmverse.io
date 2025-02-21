import type { Page, Space, User, Vote } from '@charmverse/core/prisma';
import { testUtilsProposals } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { createPage, createVote, generateSpaceUser, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generateProposal } from '@packages/testing/utils/proposals';
import request from 'supertest';
import { v4 } from 'uuid';

let page: Page;

let space1: Space;
let proposalAuthor: User;
let space1User: User;
let cancelledVote: Vote;
let inProgressVote: Vote;

// ------------
let space2: Space;
let space2User: User;
let space2Page: Page;
let space2Vote: Vote;

let userCookie: string;

beforeAll(async () => {
  const { space: generatedSpace1, user: generatedUser1 } = await generateUserAndSpace({ isAdmin: false });
  const { space: generatedSpace2, user: generatedUser2 } = await generateUserAndSpace({ isAdmin: false });
  proposalAuthor = await generateSpaceUser({
    isAdmin: false,
    spaceId: generatedSpace1.id
  });
  space1 = generatedSpace1;
  space2 = generatedSpace2;

  space1User = generatedUser1 as User;
  space2User = generatedUser2 as User;

  page = await createPage({
    createdBy: generatedUser1.id,
    spaceId: space1.id,
    pagePermissions: [
      {
        permissionLevel: 'view_comment',
        spaceId: space1.id
      }
    ]
  });
  cancelledVote = await createVote({
    createdBy: generatedUser1.id,
    pageId: page.id,
    spaceId: space1.id,
    status: 'Cancelled',
    voteOptions: ['3', '4']
  });

  inProgressVote = await createVote({
    createdBy: generatedUser1.id,
    pageId: page.id,
    spaceId: space1.id,
    voteOptions: ['1', '2']
  });

  space2Page = await createPage({
    createdBy: space2User.id,
    spaceId: space2.id,
    pagePermissions: [
      {
        permissionLevel: 'view_comment',
        spaceId: space2.id
      }
    ]
  });

  space2Vote = await createVote({
    createdBy: space2User.id,
    pageId: space2Page.id,
    spaceId: space2.id,
    voteOptions: ['1', '2']
  });

  userCookie = await loginUser(generatedUser1.id);
});

describe('POST /api/votes/[id]/cast - Cast a vote on a page poll', () => {
  it('Should cast vote and respond 200', async () => {
    await request(baseUrl)
      .post(`/api/votes/${inProgressVote.id}/cast`)
      .set('Cookie', userCookie)
      .send({
        choices: ['1']
      })
      .expect(200);
  });

  it("Should fail if the body doesn't have correct fields and respond 400", async () => {
    await request(baseUrl).post(`/api/votes/${inProgressVote.id}/cast`).set('Cookie', userCookie).send({}).expect(400);
  });

  it("Should fail if the vote doesn't exist and respond 404", async () => {
    await request(baseUrl)
      .post(`/api/votes/${v4()}/cast`)
      .set('Cookie', userCookie)
      .send({
        choices: ['3']
      })
      .expect(404);
  });

  it('Should fail if the vote has been cancelled and respond 400', async () => {
    await request(baseUrl)
      .post(`/api/votes/${cancelledVote.id}/cast`)
      .set('Cookie', userCookie)
      .send({
        choices: ['3']
      })
      .expect(400);
  });

  it("Should fail if the user choice is not included in vote's options and respond 400", async () => {
    await request(baseUrl)
      .post(`/api/votes/${inProgressVote.id}/cast`)
      .set('Cookie', userCookie)
      .send({
        choices: [v4()]
      })
      .expect(400);
  });

  it("Should fail if the user don't have access to the space the page of the vote is part of and respond 401", async () => {
    await request(baseUrl)
      .post(`/api/votes/${space2Vote.id}/cast`)
      .set('Cookie', userCookie)
      .send({
        choices: ['1']
      })
      .expect(401);
  });
});
describe('POST /api/votes/[id]/cast - Cast a vote on a proposal', () => {
  xit('Should allow voting if the proposal is in vote_active stage and user has permission', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space1.id,
      userId: proposalAuthor.id as string,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'vote',
          permissions: [],
          reviewers: [{ group: 'space_member' }]
        }
      ]
    });

    const proposalVote = await createVote({
      createdBy: space1User.id,
      context: 'proposal',
      type: 'Approval',
      pageId: proposal.id,
      spaceId: space1.id,
      voteOptions: ['Yes', 'No']
    });

    const result = await request(baseUrl)
      .post(`/api/votes/${proposalVote.id}/cast`)
      .set('Cookie', userCookie)
      .send({
        choices: ['Yes']
      })
      .expect(200);

    expect(result.body).toMatchObject({});
  });

  it('Should not allow voting if the proposal is not in vote_active stage', async () => {
    const proposal = await generateProposal({
      spaceId: space1.id,
      userId: proposalAuthor.id as string,
      proposalStatus: 'published'
    });

    const proposalVote = await createVote({
      createdBy: space1User.id,
      context: 'proposal',
      type: 'Approval',
      pageId: proposal.id,
      spaceId: space1.id,
      voteOptions: ['Yes', 'No']
    });

    await request(baseUrl)
      .post(`/api/votes/${proposalVote.id}/cast`)
      .set('Cookie', userCookie)
      .send({
        choices: ['Yes']
      })
      .expect(401);
  });

  it('Should not allow voting if the user does not have permission to vote in this category', async () => {
    const proposal = await generateProposal({
      spaceId: space1.id,
      userId: proposalAuthor.id as string,
      proposalStatus: 'published'
    });

    const proposalVote = await createVote({
      createdBy: space1User.id,
      context: 'proposal',
      type: 'Approval',
      pageId: proposal.id,
      spaceId: space1.id,
      voteOptions: ['Yes', 'No']
    });

    await request(baseUrl)
      .post(`/api/votes/${proposalVote.id}/cast`)
      .set('Cookie', userCookie)
      .send({
        choices: ['Yes']
      })
      .expect(401);
  });
});
