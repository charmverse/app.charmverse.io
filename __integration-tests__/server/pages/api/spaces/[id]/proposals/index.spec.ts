import type { Space, User } from '@charmverse/core/prisma';
import type { Proposal } from '@charmverse/core/prisma-client';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import { baseUrl, loginUser } from 'testing/mockApiCall';

describe('GET /api/spaces/[id]/proposals - Get proposals in a space', () => {
  let space: Space;
  let adminUser: User;
  let memberUser: User;

  let adminCookie: string;
  let memberCookie: string;

  let hiddenCategoryFeedbackProposal: Proposal;

  let visibleCategoryDraftProposal: Proposal;
  let visibleCategoryFeedbackProposalReviewedByAdmin: Proposal;

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
      proposalStatus: 'discussion'
    });

    hiddenCategoryFeedbackProposal = proposal1;

    const { page: page2, ...proposal2 } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      proposalStatus: 'draft'
    });

    visibleCategoryDraftProposal = proposal2;

    const { page: page3, ...proposal3 } = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: adminUser.id,
      authors: [adminUser.id],
      proposalStatus: 'discussion',
      reviewers: [{ group: 'user', id: adminUser.id }]
    });

    visibleCategoryFeedbackProposalReviewedByAdmin = proposal3;

    const templateProposal = await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: adminUser.id,
      authors: [adminUser.id],
      proposalStatus: 'discussion',
      reviewers: [{ group: 'user', id: adminUser.id }]
    });
  });

  it('Should return all proposals a user can access excluding templates, responding 200', async () => {
    const proposals = (await (
      await request(baseUrl).get(`/api/spaces/${space.id}/proposals`).set('Cookie', memberCookie).expect(200)
    ).body) as ProposalWithUsers[];

    expect(proposals).toHaveLength(1);

    expect(proposals).toMatchObject(
      expect.arrayContaining<ProposalWithUsers>([
        expect.objectContaining<ProposalWithUsers>({
          ...visibleCategoryFeedbackProposalReviewedByAdmin,
          authors: [
            {
              proposalId: visibleCategoryFeedbackProposalReviewedByAdmin.id,
              userId: adminUser.id
            }
          ],
          reviewers: [
            expect.objectContaining({
              id: expect.any(String),
              proposalId: visibleCategoryFeedbackProposalReviewedByAdmin.id,
              userId: adminUser.id
            })
          ]
        })
      ])
    );
  });

  it('Should return all proposals for an admin, responding 200', async () => {
    const proposals = (await (
      await request(baseUrl).get(`/api/spaces/${space.id}/proposals`).set('Cookie', adminCookie).expect(200)
    ).body) as ProposalWithUsers[];

    expect(proposals).toHaveLength(3);

    expect(proposals).toEqual([
      expect.objectContaining({
        id: hiddenCategoryFeedbackProposal.id
      }),
      expect.objectContaining({
        id: visibleCategoryDraftProposal.id
      }),
      expect.objectContaining({
        id: visibleCategoryFeedbackProposalReviewedByAdmin.id
      })
    ]);
  });

  it('should support searching for proposals if an anonymous user makes a request, responding with 200', async () => {
    const proposals = (await request(baseUrl).get(`/api/spaces/${space.id}/proposals`).expect(200)).body;

    expect(proposals).toEqual([]);
  });
});
