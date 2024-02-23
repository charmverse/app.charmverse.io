import type { ProposalOperation } from '@charmverse/core/prisma-client';
import { ProposalSystemRole, prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { testUtilsUser } from '@charmverse/core/test';

import { generateProposalWorkflow } from '../proposals';

describe('generateProposalWorkflow', () => {
  let spaceId: string;

  beforeAll(async () => {
    // Setup: Create a space and use its ID for the workflow generation
    const { space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    spaceId = space.id;
  });

  afterAll(async () => {
    // Cleanup: Delete the test space and its workflows to maintain isolation
    await prisma.proposalWorkflow.deleteMany({ where: { spaceId } });
    await prisma.space.delete({ where: { id: spaceId } });
  });

  it('successfully creates a proposal workflow in an existing space', async () => {
    const title = 'Test Workflow';
    const workflow = await generateProposalWorkflow({
      spaceId,
      title,
      evaluations: [
        {
          permissions: [
            // author permissions
            ...['view', 'edit', 'comment', 'move'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.author
            })),
            // member permissions
            ...['view', 'comment'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.space_member
            }))
          ],
          title: 'Feedback',
          type: 'feedback'
        },
        {
          permissions: [
            // author permissions
            ...['view', 'edit', 'comment', 'move'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.author
            })),
            // reviewer permissions
            ...['view', 'comment', 'move'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.current_reviewer
            })),
            // all reviewers - this is redundant since all members have view/comment access, but we include it as an example for user education
            ...['view', 'comment'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.all_reviewers
            })),
            // member permissions
            ...['view', 'comment'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.space_member
            }))
          ],
          title: 'Rubric',
          type: 'rubric'
        },
        {
          permissions: [
            // author permissions
            ...['view', 'edit', 'comment', 'move'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.author
            })),
            // reviewer permissions
            ...['view', 'comment', 'move'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.current_reviewer
            })),
            // all reviewers - this is redundant since all members have view/comment access, but we include it as an example for user education
            ...['view', 'comment'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.all_reviewers
            })),
            // member permissions
            ...['view', 'comment'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.space_member
            }))
          ],
          title: 'Vote',
          type: 'vote'
        }
      ]
    });

    // Assertions to verify the workflow was created with the expected properties
    expect(workflow).toBeDefined();
    expect(workflow.title).toBe(title);
    expect(workflow.spaceId).toBe(spaceId);
    expect(workflow.evaluations.length).toBeGreaterThan(0);

    expect(workflow).toMatchObject({
      id: expect.any(String),
      createdAt: expect.any(Date),
      index: 0,
      evaluations: [
        {
          id: expect.any(String),
          type: 'feedback',
          permissions: [
            // author permissions
            ...['view', 'edit', 'comment', 'move'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.author
            })),
            // member permissions
            ...['view', 'comment'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.space_member
            }))
          ],
          title: 'Feedback'
        },
        {
          id: expect.any(String),
          type: 'rubric',
          title: 'Rubric',
          permissions: [
            // author permissions
            ...['view', 'edit', 'comment', 'move'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.author
            })),
            // reviewer permissions
            ...['view', 'comment', 'move'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.current_reviewer
            })),
            // all reviewers - this is redundant since all members have view/comment access, but we include it as an example for user education
            ...['view', 'comment'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.all_reviewers
            })),
            // member permissions
            ...['view', 'comment'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.space_member
            }))
          ]
        },
        {
          id: expect.any(String),
          title: 'Vote',
          type: 'vote',
          permissions: [
            // author permissions
            ...['view', 'edit', 'comment', 'move'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.author
            })),
            // reviewer permissions
            ...['view', 'comment', 'move'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.current_reviewer
            })),
            // all reviewers - this is redundant since all members have view/comment access, but we include it as an example for user education
            ...['view', 'comment'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.all_reviewers
            })),
            // member permissions
            ...['view', 'comment'].map((operation) => ({
              operation: operation as ProposalOperation,
              systemRole: ProposalSystemRole.space_member
            }))
          ]
        }
      ]
    } as ProposalWorkflowTyped);

    // Additional checks for the structure of evaluations, if necessary
  });
});
