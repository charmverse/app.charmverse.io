import type { Space, User, ProposalWorkflow, Role } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';
import { v4 as uuid } from 'uuid';

import type { CreateProposalInput } from 'lib/proposals/createProposal';
import { emptyDocument } from 'lib/prosemirror/constants';
import { assignRole } from 'lib/roles';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { createRole } from 'testing/utils/roles';

let space: Space;
let proposalCreator: User;
let spaceMember: User;
let proposalCreatorRole: Role;
let workflow: ProposalWorkflowTyped;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
  space = generated.space;
  proposalCreator = generated.user;
  spaceMember = await testUtilsUser.generateSpaceUser({
    spaceId: space.id
  });
  proposalCreatorRole = await createRole({
    spaceId: space.id,
    createdBy: proposalCreator.id,
    name: 'Proposal Creator'
  });

  await assignRole({
    roleId: proposalCreatorRole.id,
    userId: proposalCreator.id
  });

  await prisma.spacePermission.create({
    data: {
      forSpace: { connect: { id: space.id } },
      operations: ['createProposals'],
      role: { connect: { id: proposalCreatorRole.id } }
    }
  });

  workflow = (await prisma.proposalWorkflow.create({
    data: {
      index: 0,
      title: 'Default flow',
      spaceId: space.id,
      evaluations: [
        {
          id: uuid(),
          title: 'Pass/fail',
          permissions: [
            { systemRole: 'all_reviewers', operation: 'comment' },
            { operation: 'view', systemRole: 'space_member' }
          ],
          type: 'pass_fail'
        }
      ]
    }
  })) as ProposalWorkflowTyped;
});

describe('POST /api/proposals - Create a proposal', () => {
  it('should allow a user to create a proposal and respond with 201', async () => {
    const userCookie = await loginUser(proposalCreator.id);
    const otherUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const input: CreateProposalInput = {
      spaceId: space.id,
      userId: proposalCreator.id,
      authors: [proposalCreator.id, otherUser.id],
      pageProps: {
        title: 'Proposal title',
        content: { ...emptyDocument },
        contentText: 'Empty proposal'
      },
      workflowId: workflow.id,
      evaluations: [
        {
          id: uuid(),
          type: 'feedback',
          reviewers: [{ userId: proposalCreator.id }],
          title: 'Feedback',
          index: 0,
          rubricCriteria: []
        }
      ]
    };

    await request(baseUrl).post('/api/proposals').set('Cookie', userCookie).send(input).expect(201);
  });

  it('should fail to create a proposal if the user does not have permissions for creating proposal and respond with 401', async () => {
    const userCookie = await loginUser(spaceMember.id);

    const input: CreateProposalInput = {
      spaceId: space.id,
      userId: spaceMember.id,
      authors: [spaceMember.id],
      evaluations: [
        {
          id: uuid(),
          type: 'feedback',
          reviewers: [{ userId: spaceMember.id }],
          title: 'Feedback',
          index: 0,
          rubricCriteria: []
        }
      ],
      workflowId: workflow.id,
      pageProps: {
        title: 'Proposal title',
        content: { ...emptyDocument },
        contentText: 'Empty proposal'
      }
    };
    await request(baseUrl).post('/api/proposals').set('Cookie', userCookie).send(input).expect(401);
  });

  it('should fail to create a proposal template if the user is not an admin', async () => {
    const userCookie = await loginUser(proposalCreator.id);
    const otherUser = await testUtilsUser.generateSpaceUser({
      spaceId: space.id
    });

    const input: CreateProposalInput = {
      spaceId: space.id,
      userId: proposalCreator.id,
      authors: [proposalCreator.id, otherUser.id],
      evaluations: [
        {
          id: workflow.evaluations[0]?.id,
          type: 'feedback',
          reviewers: [{ userId: proposalCreator.id }],
          title: 'Feedback',
          index: 0,
          rubricCriteria: []
        }
      ],
      workflowId: workflow.id,
      pageProps: {
        title: 'Proposal title',
        content: { ...emptyDocument },
        contentText: 'Empty proposal',
        type: 'proposal_template'
      }
    };
    await request(baseUrl).post('/api/proposals').set('Cookie', userCookie).send(input).expect(401);
  });

  it('should succeed if the proposal matches the template and respond with 201', async () => {
    const template = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalCreator.id,
      authors: [proposalCreator.id],
      proposalStatus: 'draft',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          permissions: [],
          reviewers: [{ group: 'user', id: proposalCreator.id }, { group: 'space_member' }],
          title: 'Feedback'
        }
      ]
    });
    const userCookie = await loginUser(proposalCreator.id);

    const input: CreateProposalInput = {
      spaceId: space.id,
      userId: spaceMember.id,
      authors: [spaceMember.id],
      pageProps: {
        sourceTemplateId: template.id,
        title: 'Proposal title',
        content: { ...emptyDocument },
        contentText: 'Empty proposal'
      },
      evaluations: [
        {
          id: template.evaluations[0].id,
          type: 'pass_fail',
          reviewers: [{ userId: proposalCreator.id }, { systemRole: 'space_member' }],
          title: 'Feedback',
          index: 0,
          rubricCriteria: []
        }
      ],
      workflowId: workflow.id
    };
    await request(baseUrl).post('/api/proposals').set('Cookie', userCookie).send(input).expect(201);
  });

  it('should fail if the proposal does not match the template and respond with 401', async () => {
    const template = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalCreator.id,
      authors: [proposalCreator.id],
      proposalStatus: 'draft',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          permissions: [],
          reviewers: [{ group: 'user', id: proposalCreator.id }],
          title: 'Feedback'
        }
      ]
    });
    const userCookie = await loginUser(proposalCreator.id);

    const input: CreateProposalInput = {
      spaceId: space.id,
      userId: spaceMember.id,
      authors: [spaceMember.id],
      pageProps: {
        sourceTemplateId: template.id,
        title: 'Proposal title',
        content: { ...emptyDocument },
        contentText: 'Empty proposal'
      },
      evaluations: [
        {
          id: template.evaluations[0].id,
          type: 'feedback',
          reviewers: [{ userId: spaceMember.id }],
          title: 'Feedback',
          index: 0,
          rubricCriteria: []
        }
      ],
      workflowId: workflow.id
    };
    await request(baseUrl).post('/api/proposals').set('Cookie', userCookie).send(input).expect(401);
  });

  it('should pass if the proposal does not match the template and respond with 201', async () => {
    const admin = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: true
    });
    const template = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalCreator.id,
      authors: [proposalCreator.id],
      proposalStatus: 'draft',
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          permissions: [],
          reviewers: [{ group: 'user', id: proposalCreator.id }],
          title: 'Feedback'
        }
      ]
    });
    const userCookie = await loginUser(admin.id);

    const input: CreateProposalInput = {
      spaceId: space.id,
      userId: spaceMember.id,
      authors: [spaceMember.id],
      pageProps: {
        sourceTemplateId: template.id,
        title: 'Proposal title',
        content: { ...emptyDocument },
        contentText: 'Empty proposal'
      },
      evaluations: [
        {
          id: template.evaluations[0].id,
          type: 'feedback',
          reviewers: [{ userId: spaceMember.id }],
          title: 'Feedback',
          index: 0,
          rubricCriteria: []
        }
      ],
      workflowId: workflow.id
    };
    await request(baseUrl).post('/api/proposals').set('Cookie', userCookie).send(input).expect(201);
  });
});
