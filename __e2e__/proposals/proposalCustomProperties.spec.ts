import type { ProposalSystemRole, ProposalWorkflow, Role, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { testUtilsMembers, testUtilsSpaces } from '@charmverse/core/test';
import { expect, test } from '__e2e__/utils/test';
import { v4 as uuid } from 'uuid';

import { generateUserAndSpace, loginBrowserUser } from '../utils/mocks';

test.describe.serial('Proposal Evaluation', () => {
  let space: Space;
  let admin: User;
  let role: Role;

  const settingsToTest = {
    proposalTitle: 'Proposal test title',
    rubricLabel: 'Rubric criteria label',
    rubricDescription: 'Rubric criteria description',
    rubricMinScore: 1,
    rubricMaxScore: 10,
    voteDuration: 12,
    votePassThreshold: 70,
    evaluationFeedbackTitle: 'Feedback Eval',
    evaluationPassFailTitle: 'Pass/Fail Eval',
    evaluationRubricTitle: 'Rubric Eval',
    evaluationVoteTitle: 'Community Vote Eval'
  };

  const proposalEvaluationPermissions: WorkflowEvaluationJson[] = [
    {
      id: uuid(),
      title: settingsToTest.evaluationFeedbackTitle,
      permissions: [
        { systemRole: 'all_reviewers', operation: 'comment' },
        { operation: 'view', systemRole: 'space_member' }
      ],
      type: 'feedback'
    },
    {
      id: uuid(),
      title: settingsToTest.evaluationRubricTitle,
      permissions: [
        { systemRole: 'all_reviewers', operation: 'comment' },
        { operation: 'view', systemRole: 'space_member' }
      ],
      type: 'rubric'
    },
    {
      id: uuid(),
      title: settingsToTest.evaluationPassFailTitle,
      permissions: [
        { systemRole: 'all_reviewers', operation: 'comment' },
        { operation: 'view', systemRole: 'space_member' }
      ],
      type: 'pass_fail'
    },
    {
      id: uuid(),
      title: settingsToTest.evaluationVoteTitle,
      permissions: [
        { systemRole: 'all_reviewers', operation: 'comment' },
        { operation: 'view', systemRole: 'space_member' }
      ],
      type: 'vote'
    }
  ];

  let workflow: ProposalWorkflow;

  test.beforeAll(async ({ browser }) => {
    ({ space, user: admin } = await generateUserAndSpace({
      isAdmin: true,
      onboarded: true,
      skipOnboarding: true,
      spaceDomain: `cvt-${uuid()}`
    }));
    await testUtilsSpaces.addSpaceOperations({
      forSpaceId: space.id,
      spaceId: space.id,
      operations: ['createProposals']
    });
    workflow = await prisma.proposalWorkflow.create({
      data: {
        index: 0,
        title: 'Default flow',
        space: { connect: { id: space.id } },
        evaluations: proposalEvaluationPermissions
      }
    });
    role = await testUtilsMembers.generateRole({
      createdBy: admin.id,
      spaceId: space.id
    });
  });
  test('A user creates a proposal that uses a workflow', async ({ proposalListPage, documentPage, proposalPage }) => {
    // Initial setup
    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: admin.id
    });

    await proposalListPage.goToProposals(space.domain);

    await proposalListPage.waitForProposalsList();

    await proposalListPage.createProposalButton.click();

    await expect(documentPage.charmEditor).toBeVisible();

    // Configure proposal settings
    await documentPage.documentTitle.click();

    await documentPage.documentTitle.locator('textarea').first().fill(settingsToTest.proposalTitle);

    await documentPage.charmEditor.fill('This is a test proposal');

    // Workflow auto-selected when loading the proposal
    const workflowSelectTextContent = await proposalPage.workflowSelect.textContent();
    expect(workflowSelectTextContent).toBe(workflow.title);

    // Move into configuring the actual evaluation
    await expect(proposalPage.evaluationSettingsSidebar).toBeVisible();

    // Configure rubric
    await proposalPage.selectEvaluationReviewer('rubric', 'space_member' as ProposalSystemRole);

    await proposalPage.addRubricCriteriaButton.click();

    await proposalPage.editRubricCriteriaLabel.fill(settingsToTest.rubricLabel);
    await proposalPage.editRubricCriteriaDescription.fill(settingsToTest.rubricDescription);
    await proposalPage.editRubricCriteriaMinScore.fill(settingsToTest.rubricMinScore.toString());
    await proposalPage.editRubricCriteriaMaxScore.fill(settingsToTest.rubricMaxScore.toString());

    // Configure review
    await proposalPage.selectEvaluationReviewer('pass_fail', role.id);

    // Configure vote
    await proposalPage.selectEvaluationReviewer('vote', 'space_member');

    await proposalPage.evaluationVoteDurationInput.fill(settingsToTest.voteDuration.toString());
    await proposalPage.evaluationVotePassThresholdInput.fill(settingsToTest.votePassThreshold.toString());

    proposalPage.saveDraftButton.click();

    await proposalPage.page.waitForResponse('**/api/proposals');

    // Test proposal data at the database level to ensure correct persistence
    const proposal = await prisma.proposal.findFirstOrThrow({
      where: {
        spaceId: space.id,
        page: {
          title: settingsToTest.proposalTitle,
          type: 'proposal'
        }
      },
      include: {
        evaluations: {
          include: {
            reviewers: true,
            permissions: true,
            rubricCriteria: true
          },
          orderBy: { index: 'asc' }
        },
        page: true
      }
    });

    await documentPage.waitForDocumentPage({ domain: space.domain, path: proposal.page?.path as string });

    expect(proposal.page?.title).toBe(settingsToTest.proposalTitle);

    expect(proposal.workflowId).toBe(workflow.id);

    expect(proposal.evaluations[0]).toMatchObject(
      expect.objectContaining({
        type: 'feedback',
        index: 0,
        proposalId: proposal.id,
        title: settingsToTest.evaluationFeedbackTitle,
        reviewers: [],
        rubricCriteria: [],
        permissions: expect.arrayContaining(
          proposalEvaluationPermissions[0].permissions.map((p) => expect.objectContaining(p))
        )
      })
    );
    expect(proposal.evaluations[1]).toMatchObject(
      expect.objectContaining({
        reviewers: expect.arrayContaining([
          expect.objectContaining({
            proposalId: proposal.id,
            roleId: null,
            userId: null,
            systemRole: 'space_member'
          })
        ]),
        permissions: expect.arrayContaining(
          proposalEvaluationPermissions[1].permissions.map((p) => expect.objectContaining(p))
        ),
        type: 'rubric',
        index: 1,
        proposalId: proposal.id,
        title: settingsToTest.evaluationRubricTitle,
        rubricCriteria: expect.arrayContaining([
          expect.objectContaining({
            title: settingsToTest.rubricLabel,
            description: settingsToTest.rubricDescription,
            type: 'range',
            index: 0,
            proposalId: proposal.id,
            parameters: {
              max: settingsToTest.rubricMaxScore,
              min: settingsToTest.rubricMinScore
            }
          })
        ])
      })
    );

    expect(proposal.evaluations[2]).toMatchObject({
      reviewers: [
        {
          evaluationId: expect.any(String),
          id: expect.any(String),
          proposalId: proposal.id,
          roleId: role.id,
          userId: null,
          systemRole: null
        }
      ],
      permissions: expect.arrayContaining(
        proposalEvaluationPermissions[2].permissions.map((p) => expect.objectContaining(p))
      ),
      type: 'pass_fail',
      index: 2,
      proposalId: proposal.id,
      result: null,
      snapshotExpiry: null,
      snapshotId: null,
      title: settingsToTest.evaluationPassFailTitle,
      rubricCriteria: []
    });

    expect(proposal.evaluations[3]).toMatchObject({
      reviewers: [
        {
          evaluationId: expect.any(String),
          id: expect.any(String),
          proposalId: proposal.id,
          roleId: null,
          userId: null,
          systemRole: 'space_member'
        }
      ],
      permissions: expect.arrayContaining(
        proposalEvaluationPermissions[3].permissions.map((p) => expect.objectContaining(p))
      ),
      type: 'vote',
      index: 3,
      proposalId: proposal.id,
      result: null,
      snapshotExpiry: null,
      snapshotId: null,
      title: settingsToTest.evaluationVoteTitle,
      voteId: null,
      voteSettings: {
        durationDays: settingsToTest.voteDuration,
        maxChoices: 1,
        options: ['Yes', 'No', 'Abstain'],
        publishToSnapshot: false,
        threshold: settingsToTest.votePassThreshold,
        type: 'Approval'
      },
      rubricCriteria: []
    });
  });
});
