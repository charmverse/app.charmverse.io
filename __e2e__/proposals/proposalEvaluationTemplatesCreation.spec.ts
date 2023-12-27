import type {
  Page,
  Proposal,
  ProposalCategory,
  ProposalEvaluation,
  ProposalEvaluationPermission,
  ProposalReviewer,
  ProposalRubricCriteria,
  ProposalSystemRole,
  ProposalWorkflow,
  Role,
  Space,
  User
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { testUtilsMembers, testUtilsProposals } from '@charmverse/core/test';
import { expect, test } from '__e2e__/utils/test';
import { v4 as uuid } from 'uuid';

import { generateUser, generateUserAndSpace, loginBrowserUser } from '../utils/mocks';

test.describe.serial('Proposal Evaluation', () => {
  let space: Space;
  let admin: User;
  let member: User;
  let proposalCategory: ProposalCategory;
  let role: Role;

  let templateId: string;

  // This will be setup after the first test to be used in the following test
  let proposalTemplate: Proposal & {
    page: Page;
    evaluations: (ProposalEvaluation & {
      reviewers: ProposalReviewer[];
      permissions: ProposalEvaluationPermission[];
      rubricCriteria: ProposalRubricCriteria[];
    })[];
  };

  const settingsToTest = {
    proposalTitle: 'Proposal test title',
    standaloneProposalTitle: 'Standalone proposal test title',
    proposalTemplateTitle: 'Proposal template e2e test',
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
    member = await generateUser({ space: { id: space.id, isAdmin: false } });
    proposalCategory = await testUtilsProposals.generateProposalCategory({
      title: 'General',
      spaceId: space.id
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
  test('An admin can create a template that uses a workflow', async ({
    proposalListPage,
    documentPage,
    proposalPage
  }) => {
    // Initial setup
    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: admin.id
    });

    await proposalListPage.goToProposals(space.domain);

    await proposalListPage.waitForProposalsList();

    await proposalListPage.proposalTemplateSelect.click();

    await proposalListPage.addNewTemplate.click();

    await proposalListPage.proposalTemplateFreeFormOption.click();

    await expect(documentPage.charmEditor).toBeVisible();

    // Configure proposal settings
    await documentPage.documentTitle.click();

    await documentPage.documentTitle.locator('textarea').first().fill(settingsToTest.proposalTemplateTitle);

    await documentPage.charmEditor.fill('This is a test proposal');

    await proposalPage.selectCategory(proposalCategory.id);

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

    await proposalPage.saveDraftButton.click();

    await proposalPage.page.waitForResponse('**/api/proposals');

    // Test proposal data at the database level to ensure correct persistence
    proposalTemplate = (await prisma.proposal.findFirstOrThrow({
      where: {
        spaceId: space.id,
        page: {
          title: settingsToTest.proposalTemplateTitle,
          type: 'proposal_template'
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
    })) as any;

    templateId = proposalTemplate.id;

    expect(proposalTemplate.page?.title).toBe(settingsToTest.proposalTemplateTitle);

    expect(proposalTemplate.workflowId).toBe(workflow.id);

    expect(proposalTemplate.evaluations).toHaveLength(4);

    expect(proposalTemplate.evaluations[0]).toMatchObject(
      expect.objectContaining({
        type: 'feedback',
        index: 0,
        proposalId: proposalTemplate.id,
        title: settingsToTest.evaluationFeedbackTitle,
        reviewers: [],
        rubricCriteria: []
      })
    );

    expect(proposalTemplate.evaluations[1]).toMatchObject(
      expect.objectContaining({
        reviewers: [
          expect.objectContaining({
            proposalId: proposalTemplate.id,
            roleId: null,
            userId: null,
            systemRole: 'space_member'
          })
        ],
        type: 'rubric',
        index: 1,
        proposalId: proposalTemplate.id,
        title: settingsToTest.evaluationRubricTitle,
        rubricCriteria: [
          expect.objectContaining({
            title: settingsToTest.rubricLabel,
            description: settingsToTest.rubricDescription,
            type: 'range',
            index: 0,
            proposalId: proposalTemplate.id,
            parameters: {
              max: settingsToTest.rubricMaxScore,
              min: settingsToTest.rubricMinScore
            }
          })
        ]
      })
    );

    expect(proposalTemplate.evaluations[2]).toMatchObject({
      reviewers: [
        {
          evaluationId: expect.any(String),
          id: expect.any(String),
          proposalId: proposalTemplate.id,
          roleId: role.id,
          userId: null,
          systemRole: null
        }
      ],
      type: 'pass_fail',
      index: 2,
      proposalId: proposalTemplate.id,
      result: null,
      snapshotExpiry: null,
      snapshotId: null,
      title: settingsToTest.evaluationPassFailTitle,
      rubricCriteria: []
    });

    expect(proposalTemplate.evaluations[3]).toMatchObject({
      reviewers: [
        {
          evaluationId: expect.any(String),
          id: expect.any(String),
          proposalId: proposalTemplate.id,
          roleId: null,
          userId: null,
          systemRole: 'space_member'
        }
      ],
      type: 'vote',
      index: 3,
      proposalId: proposalTemplate.id,
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

  test('A member can create a proposal from a template', async ({ proposalListPage, documentPage, proposalPage }) => {
    // Initial setup
    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: member.id
    });

    await proposalListPage.goToProposals(space.domain);

    await proposalListPage.waitForProposalsList();

    await proposalListPage.proposalTemplateSelect.click();

    await proposalListPage.getTemplateOptionLocator(templateId).click();
    await expect(documentPage.charmEditor).toBeVisible();

    // Configure proposal settings
    await documentPage.documentTitle.click();

    await documentPage.documentTitle.locator('textarea').first().fill(settingsToTest.proposalTitle);

    await documentPage.charmEditor.fill('This is a test proposal');

    await proposalPage.saveDraftButton.click();

    await proposalPage.page.waitForResponse('**/api/proposals');

    // Test proposal data at the database level to ensure correct persistence
    const proposalFromTemplate = (await prisma.proposal.findFirstOrThrow({
      where: {
        spaceId: space.id,
        page: {
          title: settingsToTest.proposalTitle,
          type: 'proposal',
          sourceTemplateId: templateId
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
    })) as any;

    expect(proposalFromTemplate.evaluations[0]).toMatchObject(
      expect.objectContaining({
        type: 'feedback',
        index: 0,
        proposalId: proposalFromTemplate.id,
        title: settingsToTest.evaluationFeedbackTitle,
        reviewers: [],
        rubricCriteria: [],
        permissions: expect.arrayContaining(
          proposalEvaluationPermissions[0].permissions.map((p) => expect.objectContaining(p))
        )
      })
    );

    expect(proposalFromTemplate.evaluations[1]).toMatchObject(
      expect.objectContaining({
        reviewers: [
          expect.objectContaining({
            proposalId: proposalFromTemplate.id,
            roleId: null,
            userId: null,
            systemRole: 'space_member'
          })
        ],
        permissions: expect.arrayContaining(
          proposalEvaluationPermissions[1].permissions.map((p) => expect.objectContaining(p))
        ),
        type: 'rubric',
        index: 1,
        proposalId: proposalFromTemplate.id,
        title: settingsToTest.evaluationRubricTitle,
        rubricCriteria: [
          expect.objectContaining({
            title: settingsToTest.rubricLabel,
            description: settingsToTest.rubricDescription,
            type: 'range',
            index: 0,
            proposalId: proposalFromTemplate.id,
            parameters: {
              max: settingsToTest.rubricMaxScore,
              min: settingsToTest.rubricMinScore
            }
          })
        ]
      })
    );

    expect(proposalFromTemplate.evaluations[2]).toMatchObject({
      reviewers: [
        {
          evaluationId: expect.any(String),
          id: expect.any(String),
          proposalId: proposalFromTemplate.id,
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
      proposalId: proposalFromTemplate.id,
      result: null,
      snapshotExpiry: null,
      snapshotId: null,
      title: settingsToTest.evaluationPassFailTitle,
      rubricCriteria: []
    });

    expect(proposalFromTemplate.evaluations[3]).toMatchObject({
      reviewers: [
        {
          evaluationId: expect.any(String),
          id: expect.any(String),
          proposalId: proposalFromTemplate.id,
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
      proposalId: proposalFromTemplate.id,
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
