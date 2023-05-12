import type { ProposalCategory, Space, User } from '@charmverse/core/prisma';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';
import { v4 } from 'uuid';

import type { PageWithProposal } from 'lib/pages';
import type { ProposalWithUsers } from 'lib/proposal/interface';
import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';
import { baseUrl, loginUser } from 'testing/mockApiCall';

let author: User;
let reviewer: User;
let space: Space;
let authorCookie: string;
let proposalCategory: ProposalCategory;

beforeAll(async () => {
  const generated1 = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
  space = generated1.space;
  author = generated1.user;

  const generated2 = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
  reviewer = generated2;

  authorCookie = await loginUser(author.id);

  proposalCategory = await testUtilsProposals.generateProposalCategory({
    spaceId: space.id
  });
});

describe('GET /api/proposals/[id] - Get proposal', () => {
  it('should return the proposal with the author and reviewers', async () => {
    const generatedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      authors: [author.id],
      reviewers: [{ group: 'user', id: reviewer.id }],
      proposalStatus: 'draft'
    });
    const proposal = (
      await request(baseUrl).get(`/api/proposals/${generatedProposal.id}`).set('Cookie', authorCookie).expect(200)
    ).body as ProposalWithUsers;

    expect(proposal).toMatchObject(
      expect.objectContaining({
        id: expect.any(String),
        spaceId: space.id,
        createdBy: author.id,
        status: 'draft',
        authors: expect.arrayContaining([
          expect.objectContaining({
            proposalId: generatedProposal.id,
            userId: author.id
          })
        ]),
        reviewers: [
          expect.objectContaining({
            id: expect.any(String),
            roleId: null,
            proposalId: generatedProposal.id,
            userId: reviewer.id
          })
        ]
      })
    );
  });

  it("should throw error if proposal doesn't exist", async () => {
    await request(baseUrl).get(`/api/proposals/${v4()}`).set('Cookie', authorCookie).expect(404);
  });

  // Users should not be able to access draft proposals that they are not authors or reviewers of
  it("should throw error if user doesn't have read access to proposal page", async () => {
    const normalSpaceUser = await testUtilsUser.generateSpaceUser({ isAdmin: false, spaceId: space.id });

    const cookie = await loginUser(normalSpaceUser.id);

    const generatedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'draft',
      authors: []
    });

    await request(baseUrl).get(`/api/proposals/${generatedProposal.id}`).set('Cookie', cookie).expect(404);
  });
});

describe('PUT /api/proposals/[id] - Update a proposal', () => {
  it('should update a proposal if the user is an author', async () => {
    const { user: adminUser, space: adminSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const adminCookie = await loginUser(adminUser.id);

    const role = await testUtilsMembers.generateRole({
      spaceId: adminSpace.id,
      createdBy: adminUser.id
    });

    const { page } = await testUtilsProposals.generateProposal({
      userId: adminUser.id,
      spaceId: adminSpace.id,
      categoryId: proposalCategory.id
    });

    const updateContent: Partial<UpdateProposalRequest> = {
      authors: [adminUser.id],
      reviewers: [
        {
          group: 'user',
          id: adminUser.id
        },
        {
          group: 'role',
          id: role.id
        }
      ]
    };

    const updated = (
      await request(baseUrl)
        .put(`/api/proposals/${page.proposalId}`)
        .set('Cookie', adminCookie)
        .send(updateContent)
        .expect(200)
    ).body as PageWithProposal;

    // Make sure update went through
    expect(updated.proposal?.reviewers).toHaveLength(2);
    expect(updated.proposal?.reviewers.some((r) => r.roleId === role.id)).toBe(true);
    expect(updated.proposal?.reviewers.some((r) => r.userId === adminUser.id)).toBe(true);
  });

  it('should update a proposal templates settings if the user is a space admin', async () => {
    const { user: adminUser, space: adminSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const adminCookie = await loginUser(adminUser.id);

    const role = await testUtilsMembers.generateRole({ createdBy: adminUser.id, spaceId: adminSpace.id });

    const proposalTemplate = await testUtilsProposals.generateProposalTemplate({
      spaceId: adminSpace.id,
      userId: adminUser.id,
      categoryId: proposalCategory.id
    });

    const updateContent: Partial<UpdateProposalRequest> = {
      authors: [adminUser.id],
      reviewers: [
        {
          group: 'user',
          id: adminUser.id
        },
        {
          group: 'role',
          id: role.id
        }
      ]
    };

    const updated = (
      await request(baseUrl)
        .put(`/api/proposals/${proposalTemplate.id}`)
        .set('Cookie', adminCookie)
        .send(updateContent)
        .expect(200)
    ).body as PageWithProposal;

    // Make sure update went through
    expect(updated.proposal?.reviewers).toHaveLength(2);
    expect(updated.proposal?.reviewers.some((r) => r.roleId === role.id)).toBe(true);
    expect(updated.proposal?.reviewers.some((r) => r.userId === adminUser.id)).toBe(true);
  });

  it('should fail to update a proposal if the user is an admin', async () => {
    const { user: adminUser, space: adminSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const adminCookie = await loginUser(adminUser.id);

    const proposalAuthor = await testUtilsUser.generateSpaceUser({ isAdmin: false, spaceId: adminSpace.id });

    const { page } = await testUtilsProposals.generateProposal({
      userId: proposalAuthor.id,
      spaceId: adminSpace.id,
      categoryId: proposalCategory.id
    });

    const updateContent: Partial<UpdateProposalRequest> = {
      authors: [adminUser.id],
      reviewers: [
        {
          group: 'user',
          id: adminUser.id
        }
      ]
    };

    await request(baseUrl)
      .put(`/api/proposals/${page.proposalId}`)
      .set('Cookie', adminCookie)
      .send(updateContent)
      .expect(401);
  });

  it('should fail to update a proposal template if the user is not a space admin', async () => {
    const { user: adminUser, space: adminSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
    const nonAdminUser = await testUtilsUser.generateSpaceUser({ isAdmin: false, spaceId: adminSpace.id });

    const nonAdminCookie = await loginUser(nonAdminUser.id);

    const proposalTemplate = await testUtilsProposals.generateProposalTemplate({
      spaceId: adminSpace.id,
      userId: adminUser.id,
      categoryId: proposalCategory.id,
      reviewers: [
        {
          group: 'user',
          id: adminUser.id
        }
      ]
    });

    const updateContent: Partial<UpdateProposalRequest> = {
      authors: [adminUser.id],
      reviewers: [
        {
          group: 'user',
          id: adminUser.id
        }
      ]
    };

    await request(baseUrl)
      .put(`/api/proposals/${proposalTemplate.id}`)
      .set('Cookie', nonAdminCookie)
      .send(updateContent)
      .expect(401);
  });
});
