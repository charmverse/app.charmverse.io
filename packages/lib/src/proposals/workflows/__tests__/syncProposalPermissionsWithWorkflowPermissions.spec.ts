import { InvalidInputError } from '@charmverse/core/errors';
import type { Prisma, Role, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { v4 as uuid } from 'uuid';

import { syncProposalPermissionsWithWorkflowPermissions } from '../syncProposalPermissionsWithWorkflowPermissions';

describe('syncProposalPermissionsWithWorkflowPermissions', () => {
  let user: User;
  let space: Space;
  let workflow: ProposalWorkflowTyped;
  let role: Role;
  const feedbackEvaluationTitle = 'Feedback Round';
  const rubricEvaluationTitle = 'Rubric Round';

  let feedbackWorkflowEvaluationPermissions: Omit<
    Prisma.ProposalEvaluationPermissionCreateManyInput,
    'evaluationId'
  >[] = [];

  let rubricWorkflowEvaluationPermissions: Omit<Prisma.ProposalEvaluationPermissionCreateManyInput, 'evaluationId'>[] =
    [];

  beforeAll(async () => {
    ({ user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: true }));

    role = await testUtilsMembers.generateRole({ createdBy: user.id, spaceId: space.id });

    feedbackWorkflowEvaluationPermissions = [
      {
        operation: 'view',
        roleId: role.id
      },
      {
        operation: 'complete_evaluation',
        roleId: role.id
      },
      {
        operation: 'view',
        roleId: role.id
      },
      {
        operation: 'view',
        userId: user.id
      },
      {
        operation: 'move',
        userId: user.id
      },
      {
        systemRole: 'space_member',
        operation: 'view'
      }
    ];

    rubricWorkflowEvaluationPermissions = [
      {
        operation: 'move',
        userId: user.id
      },
      {
        systemRole: 'space_member',
        operation: 'view'
      }
    ];

    // Generate Workflow and Proposal
    workflow = (await prisma.proposalWorkflow.create({
      data: {
        id: uuid(),
        spaceId: space.id,
        title: 'Workflow 1',
        index: 0,
        evaluations: [
          {
            id: uuid(),
            title: feedbackEvaluationTitle,
            type: 'feedback',
            permissions: feedbackWorkflowEvaluationPermissions
          },
          {
            id: uuid(),
            title: rubricEvaluationTitle,
            type: 'rubric',
            permissions: rubricWorkflowEvaluationPermissions
          }
        ] as (Omit<Prisma.ProposalEvaluationCreateManyInput, 'voteSettings' | 'actionLabels' | 'notificationLabels'> & {
          permissions: Omit<Prisma.ProposalEvaluationPermissionCreateManyInput, 'index' | 'proposalId'>[];
        })[]
      }
    })) as ProposalWorkflowTyped;
  });

  // Success case 1: Successful synchronization of permissions
  it('should successfully sync permissions when evaluationIds is not provided', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      evaluationInputs: workflow.evaluations.map((evaluation) => ({
        title: evaluation.title,
        evaluationType: evaluation.type,
        permissions: [],
        reviewers: []
      })),
      workflowId: workflow.id
    });

    await syncProposalPermissionsWithWorkflowPermissions({
      proposalId: proposal.id
    });

    const [feedbackEvaluation, rubricEvaluation] = await prisma.proposalEvaluation.findMany({
      where: { proposalId: proposal.id },
      include: { permissions: true },
      orderBy: {
        index: 'asc'
      }
    });

    expect(feedbackEvaluation.permissions).toHaveLength(feedbackWorkflowEvaluationPermissions.length);
    expect(rubricEvaluation.permissions).toHaveLength(rubricWorkflowEvaluationPermissions.length);

    expect(feedbackEvaluation.permissions).toMatchObject(
      expect.arrayContaining(feedbackWorkflowEvaluationPermissions.map((p) => expect.objectContaining(p)))
    );

    expect(rubricEvaluation.permissions).toMatchObject(
      expect.arrayContaining(rubricWorkflowEvaluationPermissions.map((p) => expect.objectContaining(p)))
    );
  });

  // Success case 2: Synchronization with specific evaluationIds
  it('should only sync permissions for provided evaluationIds', async () => {
    const proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      evaluationInputs: workflow.evaluations.map((evaluation) => ({
        title: evaluation.title,
        evaluationType: evaluation.type,
        permissions: [],
        reviewers: []
      })),
      workflowId: workflow.id
    });

    const feedbackEvaluationId = proposal.evaluations.find((e) => e.type === 'feedback')!.id;

    await syncProposalPermissionsWithWorkflowPermissions({
      proposalId: proposal.id,
      evaluationIds: [feedbackEvaluationId]
    });

    const [feedbackEvaluation, rubricEvaluation] = await prisma.proposalEvaluation.findMany({
      where: { proposalId: proposal.id },
      include: { permissions: true },
      orderBy: {
        index: 'asc'
      }
    });

    expect(feedbackEvaluation.permissions).toHaveLength(feedbackWorkflowEvaluationPermissions.length);
    expect(rubricEvaluation.permissions).toHaveLength(0);

    expect(feedbackEvaluation.permissions).toMatchObject(
      expect.arrayContaining(feedbackWorkflowEvaluationPermissions.map((p) => expect.objectContaining(p)))
    );
  });

  // Error case 1: Proposal missing an evaluation at index
  it('should throw error when proposal does not have a corresponding evaluation by title and evaluation type at the index', async () => {
    const invalidProposalByNotMatchingTitle = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      evaluationInputs: workflow.evaluations.map((evaluation) => ({
        title: 'Random title',
        evaluationType: evaluation.type,
        permissions: [],
        reviewers: []
      })),
      workflowId: workflow.id
    });

    await expect(
      syncProposalPermissionsWithWorkflowPermissions({
        proposalId: invalidProposalByNotMatchingTitle.id
      })
    ).rejects.toThrow(InvalidInputError);

    const invalidProposalByNotMatchingEvaluationType = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: user.id,
      evaluationInputs: workflow.evaluations.map((evaluation) => ({
        title: evaluation.title,
        evaluationType: 'sign_documents',
        permissions: [],
        reviewers: []
      })),
      workflowId: workflow.id
    });

    await expect(
      syncProposalPermissionsWithWorkflowPermissions({
        proposalId: invalidProposalByNotMatchingEvaluationType.id
      })
    ).rejects.toThrow(InvalidInputError);
  });
});
