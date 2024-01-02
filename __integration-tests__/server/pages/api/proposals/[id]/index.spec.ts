import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWithUsers } from '@charmverse/core/proposals';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';
import { v4 } from 'uuid';

import type { FormFieldInput } from 'components/common/form/interfaces';
import { createForm } from 'lib/form/createForm';
import { addSpaceOperations } from 'lib/permissions/spaces/addSpaceOperations';
import type { UpdateProposalRequest } from 'lib/proposal/updateProposal';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateRole } from 'testing/setupDatabase';

let author: User;
let reviewer: User;
let space: Space;
let authorCookie: string;

beforeAll(async () => {
  const generated1 = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
  space = generated1.space;
  author = generated1.user;

  const generated2 = await testUtilsUser.generateSpaceUser({ spaceId: space.id });
  reviewer = generated2;

  authorCookie = await loginUser(author.id);
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

  it('should return the proposal with the form fields', async () => {
    const generatedProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      authors: [author.id],
      reviewers: [{ group: 'user', id: reviewer.id }],
      proposalStatus: 'draft'
    });

    const fieldsInput: FormFieldInput[] = [
      {
        id: v4(),
        type: 'short_text',
        name: 'name',
        description: 'description',
        index: 0,
        options: [],
        private: false,
        required: true
      }
    ];
    const formId = await createForm(fieldsInput);
    await prisma.proposal.update({
      where: { id: generatedProposal.id },
      data: { formId }
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
        ],
        form: {
          id: formId,
          formFields: expect.arrayContaining(fieldsInput.map((field) => expect.objectContaining({ ...field, formId })))
        }
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

    const { page } = await testUtilsProposals.generateProposal({
      userId: adminUser.id,
      spaceId: adminSpace.id
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
      .expect(200);

    // Make sure update went through
    const proposal = await prisma.proposal.findUniqueOrThrow({
      where: { id: page.proposalId! },
      include: { reviewers: true }
    });

    expect(proposal.reviewers).toHaveLength(1);
    expect(proposal.reviewers.some((r) => r.userId === adminUser.id)).toBe(true);
  });

  it('should update a proposal templates settings if the user is a space admin', async () => {
    const { user: adminUser, space: adminSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const adminCookie = await loginUser(adminUser.id);

    const role = await testUtilsMembers.generateRole({ createdBy: adminUser.id, spaceId: adminSpace.id });

    const proposalTemplate = await testUtilsProposals.generateProposalTemplate({
      spaceId: adminSpace.id,
      userId: adminUser.id
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

    await request(baseUrl)
      .put(`/api/proposals/${proposalTemplate.id}`)
      .set('Cookie', adminCookie)
      .send(updateContent)
      .expect(200);

    // Make sure update went through
    const proposal = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposalTemplate.id
      },
      include: {
        reviewers: true
      }
    });
    expect(proposal.reviewers).toHaveLength(2);
    expect(proposal.reviewers.some((r) => r.roleId === role.id)).toBe(true);
    expect(proposal.reviewers.some((r) => r.userId === adminUser.id)).toBe(true);
  });

  it('should allow an admin to update any discussion stage proposal', async () => {
    const { user: adminUser, space: adminSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const adminCookie = await loginUser(adminUser.id);

    const proposalAuthor = await testUtilsUser.generateSpaceUser({ isAdmin: false, spaceId: adminSpace.id });

    const { page } = await testUtilsProposals.generateProposal({
      userId: proposalAuthor.id,
      spaceId: adminSpace.id,
      proposalStatus: 'discussion'
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
      .expect(200);
  });

  // This test is important so that it does not damage any existing proposals from before migrating our proposal system
  // We should only use reviewer pool logic for new proposal reviewers
  it('should fail to assign a new non-authorized user or role as a reviewer for a proposal', async () => {
    const { user: adminUser, space: adminSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const adminCookie = await loginUser(adminUser.id);

    const proposalAuthor = await testUtilsUser.generateSpaceUser({ isAdmin: false, spaceId: adminSpace.id });

    const userWithRole = await testUtilsUser.generateSpaceUser({
      spaceId: adminSpace.id
    });

    const roleWithoutAccess = await generateRole({
      createdBy: adminUser.id,
      spaceId: adminSpace.id,
      assigneeUserIds: [userWithRole.id]
    });

    // This role can only create pages but not review proposals
    await addSpaceOperations({
      forSpaceId: adminSpace.id,
      roleId: roleWithoutAccess.id,
      operations: ['createPage']
    });

    const { page } = await testUtilsProposals.generateProposal({
      userId: proposalAuthor.id,
      spaceId: adminSpace.id,
      proposalStatus: 'discussion',
      reviewers: [{ group: 'user', id: userWithRole.id }]
    });

    const reviewerUserUpdate: Partial<UpdateProposalRequest> = {
      authors: [adminUser.id],
      reviewers: [
        {
          group: 'user',
          id: userWithRole.id
        },
        // New valid reviewer being adding in, admins can always be reviewers
        {
          group: 'user',
          id: adminUser.id
        }
      ]
    };

    // Disallowed reviewer, but already exists so we expect a 200
    await request(baseUrl)
      .put(`/api/proposals/${page.proposalId}`)
      .set('Cookie', adminCookie)
      .send(reviewerUserUpdate)
      .expect(200);

    await prisma.proposalReviewer.deleteMany({
      where: {
        proposalId: page.proposalId as string
      }
    });

    // The reviewer doesn't exist anymore. This request should now be a 401
    await request(baseUrl)
      .put(`/api/proposals/${page.proposalId}`)
      .set('Cookie', adminCookie)
      .send(reviewerUserUpdate)
      .expect(401);

    const reviewerRoleUpdate: Partial<UpdateProposalRequest> = {
      authors: [adminUser.id],
      reviewers: [
        {
          group: 'role',
          id: roleWithoutAccess.id
        }
      ]
    };

    // Same as above, but test with a role
    await request(baseUrl)
      .put(`/api/proposals/${page.proposalId}`)
      .set('Cookie', adminCookie)
      .send(reviewerRoleUpdate)
      .expect(401);
  });

  it('should fail to update a proposal template if the user is not a space admin', async () => {
    const { user: adminUser, space: adminSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
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
