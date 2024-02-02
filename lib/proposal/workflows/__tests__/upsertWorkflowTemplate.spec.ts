import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { testUtilsProposals } from '@charmverse/core/test';
import { v4 as uuid } from 'uuid';

import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';

import { upsertWorkflowTemplate } from '../controller';

let user: User;
let space: Space;

beforeAll(async () => {
  const generated = await generateUserAndSpace();
  user = generated.user;
  space = generated.space;
});

describe('Saving space workflows', () => {
  it('Creates a new workflow', async () => {
    await upsertWorkflowTemplate({
      createdAt: new Date(),
      id: uuid(),
      index: 0,
      spaceId: space.id,
      title: 'My feedback workflow',
      evaluations: [
        {
          id: uuid(),
          title: 'Feedback',
          type: 'feedback',
          permissions: [
            {
              operation: 'move',
              systemRole: 'author'
            },
            {
              operation: 'view',
              systemRole: 'author'
            }
          ]
        }
      ]
    });
  });

  it('Updates a proposal template: adds a new evaluation step', async () => {
    const reviewerUser = await generateSpaceUser({
      isAdmin: false,
      spaceId: space.id
    });
    const workflow = await generateWorkflow({
      spaceId: space.id,
      evaluations: []
    });

    const proposalTemplate = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      pageType: 'proposal_template',
      workflowId: workflow.id,
      evaluationInputs: []
    });

    await upsertWorkflowTemplate({
      ...workflow,
      evaluations: [
        {
          id: uuid(),
          title: 'Feedback',
          type: 'feedback',
          permissions: []
        }
      ]
    });
    const template = await prisma.proposal.findUnique({
      where: {
        id: proposalTemplate.id
      },
      include: {
        evaluations: true
      }
    });
    expect(template?.evaluations.length).toBe(1);
  });

  it('Updates a proposal template: removes evaluation', async () => {
    const workflow = await generateWorkflow({
      spaceId: space.id,
      evaluations: [
        {
          id: uuid(),
          title: 'Feedback',
          type: 'feedback',
          permissions: []
        }
      ]
    });

    const proposalTemplate = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      pageType: 'proposal_template',
      workflowId: workflow.id,
      evaluationInputs: [
        {
          title: 'Feedback',
          evaluationType: 'feedback',
          reviewers: [],
          permissions: []
        }
      ]
    });

    await upsertWorkflowTemplate({
      ...workflow,
      evaluations: []
    });
    const template = await prisma.proposal.findUnique({
      where: {
        id: proposalTemplate.id
      },
      include: {
        evaluations: true
      }
    });
    expect(template?.evaluations.length).toBe(0);
  });

  it('Updates a proposal template: matches and updates an evaluation even when the name changes', async () => {
    const originalEvaluationId = uuid();
    const workflow = await generateWorkflow({
      spaceId: space.id,
      evaluations: [
        {
          id: originalEvaluationId,
          title: 'Original Feedback Title',
          type: 'feedback',
          permissions: []
        }
      ]
    });

    const proposalTemplate = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      pageType: 'proposal_template',
      workflowId: workflow.id,
      evaluationInputs: [
        {
          title: 'Original Feedback Title',
          evaluationType: 'feedback',
          reviewers: [],
          permissions: []
        }
      ]
    });

    await upsertWorkflowTemplate({
      ...workflow,
      evaluations: [
        {
          id: originalEvaluationId,
          title: 'Updated Feedback title',
          type: 'feedback',
          permissions: []
        }
      ]
    });
    const template = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposalTemplate.id
      },
      include: {
        evaluations: true
      }
    });
    expect(template?.evaluations[0].id).toBe(proposalTemplate.evaluations[0].id);
    expect(template?.evaluations[0].title).toBe('Updated Feedback title');
  });
});

function generateWorkflow({ spaceId, evaluations }: { spaceId: string; evaluations?: WorkflowEvaluationJson[] }) {
  return prisma.proposalWorkflow.create({
    data: {
      createdAt: new Date(),
      index: 0,
      spaceId,
      title: 'My feedback workflow',
      evaluations
    }
  });
}
