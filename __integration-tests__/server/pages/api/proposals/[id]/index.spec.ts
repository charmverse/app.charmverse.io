import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsCredentials, testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import _isEqual from 'lodash/isEqual';
import request from 'supertest';
import { v4 } from 'uuid';

import type { FormFieldInput } from 'components/common/form/interfaces';
import { createForm } from 'lib/forms/createForm';
import type { ProposalWithUsersAndRubric } from 'lib/proposals/interfaces';
import type { UpdateProposalRequest } from 'lib/proposals/updateProposal';
import { baseUrl, loginUser } from 'testing/mockApiCall';

let author: User;
let admin: User;
let reviewer: User;
let space: Space;

let authorCookie: string;

beforeAll(async () => {
  ({ space, user: author } = await testUtilsUser.generateUserAndSpace({ isAdmin: false }));
  admin = await testUtilsUser.generateSpaceUser({ isAdmin: true, spaceId: space.id });
  reviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

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
    ).body as ProposalWithUsersAndRubric;

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
        required: true,
        fieldConfig: null
      }
    ];
    const formId = await createForm(fieldsInput);
    await prisma.proposal.update({
      where: { id: generatedProposal.id },
      data: { formId }
    });

    const proposal = (
      await request(baseUrl).get(`/api/proposals/${generatedProposal.id}`).set('Cookie', authorCookie).expect(200)
    ).body as ProposalWithUsersAndRubric;

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
        // reviewers: [
        //   expect.objectContaining({
        //     id: expect.any(String),
        //     roleId: null,
        //     proposalId: generatedProposal.id,
        //     userId: reviewer.id
        //   })
        // ],
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
      authors: [adminUser.id]
    };

    await request(baseUrl)
      .put(`/api/proposals/${page.proposalId}`)
      .set('Cookie', adminCookie)
      .send(updateContent)
      .expect(200);
  });

  it('should only allow admins to update credentials if the proposal uses a template', async () => {
    const credentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved']
    });

    const secondCredentialTemplate = await testUtilsCredentials.generateCredentialTemplate({
      spaceId: space.id,
      credentialEvents: ['proposal_approved']
    });

    const template = await testUtilsProposals.generateProposalTemplate({
      spaceId: space.id,
      userId: author.id,
      pageType: 'proposal_template',
      selectedCredentialTemplateIds: [credentialTemplate.id]
    });

    const proposal = await testUtilsProposals.generateProposal({
      userId: author.id,
      spaceId: space.id,
      sourceTemplateId: template.id,
      selectedCredentialTemplateIds: [credentialTemplate.id]
    });

    const adminCookie = await loginUser(admin.id);

    const updateContent: Partial<UpdateProposalRequest> = {
      selectedCredentialTemplates: [secondCredentialTemplate.id]
    };

    await request(baseUrl)
      .put(`/api/proposals/${proposal.id}`)
      .set('Cookie', authorCookie)
      .send(updateContent)
      .expect(401);

    await request(baseUrl)
      .put(`/api/proposals/${proposal.id}`)
      .set('Cookie', adminCookie)
      .send(updateContent)
      .expect(200);

    const proposalAfterUpdate = await prisma.proposal.findUniqueOrThrow({
      where: { id: proposal.id },
      select: {
        selectedCredentialTemplates: true
      }
    });

    expect(proposalAfterUpdate.selectedCredentialTemplates).toEqual([secondCredentialTemplate.id]);
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
      authors: [adminUser.id]
    };

    await request(baseUrl)
      .put(`/api/proposals/${proposalTemplate.id}`)
      .set('Cookie', adminCookie)
      .send(updateContent)
      .expect(200);
  });

  it('should allow an admin to update any discussion stage proposal', async () => {
    const { user: adminUser, space: adminSpace } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    const adminCookie = await loginUser(adminUser.id);

    const proposalAuthor = await testUtilsUser.generateSpaceUser({ isAdmin: false, spaceId: adminSpace.id });

    const { page } = await testUtilsProposals.generateProposal({
      userId: proposalAuthor.id,
      spaceId: adminSpace.id,
      proposalStatus: 'published'
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
      authors: [adminUser.id]
    };

    await request(baseUrl)
      .put(`/api/proposals/${proposalTemplate.id}`)
      .set('Cookie', nonAdminCookie)
      .send(updateContent)
      .expect(401);
  });
});
