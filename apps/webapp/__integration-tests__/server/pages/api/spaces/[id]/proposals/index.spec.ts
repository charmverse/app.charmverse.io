import type { Space, User } from '@charmverse/core/prisma';
import type { Proposal } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

import type { ProposalWithUsersLite } from '@packages/lib/proposals/getProposals';

describe('GET /api/spaces/[id]/proposals - Get proposals in a space', () => {
  let space: Space;
  let adminUser: User;
  let memberUser: User;

  let adminCookie: string;
  let memberCookie: string;

  let draftProposal: Proposal;

  let publishedProposal: Proposal;

  let publishedProposalWithoutPermissions: Proposal;

  beforeAll(async () => {
    const { space: generatedSpace, user: generatedUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    adminUser = generatedUser;
    memberUser = await testUtilsUser.generateSpaceUser({ isAdmin: false, spaceId: generatedSpace.id });
    space = generatedSpace;
    adminCookie = await loginUser(adminUser.id);
    memberCookie = await loginUser(memberUser.id);

    const { page: page1, ...proposal1 } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      proposalStatus: 'draft',
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          permissions: [],
          reviewers: []
        }
      ]
    });

    draftProposal = proposal1;

    const { page: page2, ...proposal2 } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          permissions: [{ assignee: { group: 'user', id: memberUser.id }, operation: 'view' }],
          reviewers: []
        }
      ]
    });

    publishedProposal = proposal2;

    const { page: page3, ...proposal3 } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      authors: [adminUser.id],
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          permissions: [],
          reviewers: []
        }
      ]
    });

    publishedProposalWithoutPermissions = proposal3;

    const templateProposal = await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id,
      authors: [adminUser.id],
      proposalStatus: 'published',
      reviewers: [{ group: 'user', id: adminUser.id }]
    });
  });

  it('Should return all proposals a user can access excluding templates, responding 200', async () => {
    const proposals = (await (
      await request(baseUrl).get(`/api/spaces/${space.id}/proposals`).set('Cookie', memberCookie).expect(200)
    ).body) as ProposalWithUsersLite[];

    expect(proposals).toHaveLength(1);

    expect(proposals[0].id).toBe(publishedProposal.id);
  });

  it('Should return all proposals for an admin, responding 200', async () => {
    const proposals = (await (
      await request(baseUrl).get(`/api/spaces/${space.id}/proposals`).set('Cookie', adminCookie).expect(200)
    ).body) as ProposalWithUsersLite[];

    expect(proposals).toHaveLength(3);

    expect(proposals).toEqual([
      expect.objectContaining({
        id: draftProposal.id
      }),
      expect.objectContaining({
        id: publishedProposal.id
      }),
      expect.objectContaining({
        id: publishedProposalWithoutPermissions.id
      })
    ]);
  });

  it('should support searching for proposals if an anonymous user makes a request, responding with 200', async () => {
    const proposals = (await request(baseUrl).get(`/api/spaces/${space.id}/proposals`).expect(200)).body;

    expect(proposals).toEqual([]);
  });
});
