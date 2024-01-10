import type { Space, User } from '@charmverse/core/prisma';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';
import { v4 } from 'uuid';

import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';
import { baseUrl, loginUser } from 'testing/mockApiCall';

let author: User;
let reviewer: User;
let space: Space;
let authorCookie: string;

beforeAll(async () => {
  const generated1 = await testUtilsUser.generateUserAndSpace({ isAdmin: false, spacePaidTier: 'free' });
  space = generated1.space;
  author = generated1.user;

  const generated2 = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
  reviewer = generated2;

  authorCookie = await loginUser(author.id);
});

describe('GET /api/proposals/[id] - Get proposal - public space', () => {
  it('should return the proposal with the author and reviewers', async () => {
    const generatedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      authors: [author.id],
      reviewers: [{ group: 'user', id: reviewer.id }],
      proposalStatus: 'discussion'
    });
    // Unauthenticated request
    const proposal = (await request(baseUrl).get(`/api/proposals/${generatedProposal.id}`).expect(200))
      .body as ProposalWithUsers;

    expect(proposal).toMatchObject(
      expect.objectContaining({
        id: expect.any(String),
        spaceId: space.id,
        createdBy: author.id,
        status: 'discussion',
        authors: expect.arrayContaining([
          expect.objectContaining({
            proposalId: generatedProposal.id,
            userId: author.id
          })
        ])
        // reviewers: [
        //   expect.objectContaining({
        //     id: expect.any(String),
        //     roleId: null,
        //     proposalId: generatedProposal.id,
        //     userId: reviewer.id
        //   })
        // ]
      })
    );
  });

  it("should throw error if proposal doesn't exist", async () => {
    await request(baseUrl).get(`/api/proposals/${v4()}`).set('Cookie', authorCookie).expect(404);
  });
});

describe('PUT /api/proposals/[id] - Update a proposal', () => {
  it('should update a proposal if the user is an author', async () => {
    const { user: adminUser, space: adminSpace } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'free'
    });
    const adminCookie = await loginUser(adminUser.id);

    const { page } = await testUtilsProposals.generateProposal({
      userId: adminUser.id,
      spaceId: adminSpace.id
    });

    const updateContent: Partial<UpdateProposalRequest> = {
      authors: [adminUser.id]
    };

    await request(baseUrl)
      .put(`/api/proposals/${page.proposalId}`)
      .set('Cookie', adminCookie)
      .send(updateContent)
      .expect(200);
  });

  it('should update a proposal templates settings if the user is a space admin', async () => {
    const { user: adminUser, space: adminSpace } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'free'
    });
    const adminCookie = await loginUser(adminUser.id);

    const role = await testUtilsMembers.generateRole({ createdBy: adminUser.id, spaceId: adminSpace.id });

    const proposalTemplate = await testUtilsProposals.generateProposalTemplate({
      spaceId: adminSpace.id,
      userId: adminUser.id
    });

    const updateContent: Partial<UpdateProposalRequest> = {
      authors: [adminUser.id]
    };

    await request(baseUrl)
      .put(`/api/proposals/${proposalTemplate.id}`)
      .set('Cookie', adminCookie)
      .send(updateContent)
      .expect(200);
  });

  it('should allow an admin to update a draft proposal they did not create', async () => {
    const { user: adminUser, space: adminSpace } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'free'
    });
    const adminCookie = await loginUser(adminUser.id);

    const proposalAuthor = await testUtilsUser.generateSpaceUser({ isAdmin: false, spaceId: adminSpace.id });

    const { page } = await testUtilsProposals.generateProposal({
      userId: proposalAuthor.id,
      spaceId: adminSpace.id
    });

    const updateContent: Partial<UpdateProposalRequest> = {
      authors: [adminUser.id]
    };

    await request(baseUrl)
      .put(`/api/proposals/${page.proposalId}`)
      .set('Cookie', adminCookie)
      .send(updateContent)
      .expect(200);
  });

  it('should fail to update a proposal template if the user is not a space admin', async () => {
    const { user: adminUser, space: adminSpace } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false,
      spacePaidTier: 'free'
    });
    const nonAdminUser = await testUtilsUser.generateSpaceUser({ isAdmin: false, spaceId: adminSpace.id });

    const nonAdminCookie = await loginUser(nonAdminUser.id);

    const proposalTemplate = await testUtilsProposals.generateProposalTemplate({
      spaceId: adminSpace.id,
      userId: adminUser.id,
      reviewers: [
        {
          group: 'user',
          id: adminUser.id
        }
      ]
    });

    const updateContent: Partial<UpdateProposalRequest> = {
      authors: [adminUser.id]
    };

    await request(baseUrl)
      .put(`/api/proposals/${proposalTemplate.id}`)
      .set('Cookie', nonAdminCookie)
      .send(updateContent)
      .expect(401);
  });
});
