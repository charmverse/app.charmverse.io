import type {
  ProposalCategory,
  ProposalEvaluation,
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
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { ProposalPage } from '__e2e__/po/proposalPage.po';
import { ProposalsListPage } from '__e2e__/po/proposalsList.po';
import { test, expect } from '__e2e__/utils/test';
import { v4 as uuid } from 'uuid';

import { PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';
import type { ProposalRubricCriteriaWithTypedParams } from 'lib/proposal/rubric/interfaces';

import { generateUserAndSpace, loginBrowserUser } from '../utils/mocks';

test.describe.serial('Proposal Evaluation', () => {
  let space: Space;
  let admin: User;
  let proposalCategory: ProposalCategory;
  let role: Role;

  const settingsToTest = {
    proposalTitle: 'Proposal test title',
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
    const proposalTemplate = await prisma.proposal.findFirstOrThrow({
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
    });

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
          {
            proposalId: proposalTemplate.id,
            roleId: null,
            userId: null,
            systemRole: 'space_member'
          }
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
      voteId: expect.any(String),
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

    await proposalPage.page.pause();
  });

  // test('A proposal author can move draft proposal to feedback', async () => {
  //   await authorBrowserProposalListPage.openProposalCard(proposalId);

  //   await authorBrowserProposalPage.waitForDocumentPage({ domain: space.domain, path: pagePath });
  //   await expect(authorBrowserProposalPage.nextStatusButton).toHaveText(PROPOSAL_STATUS_LABELS.discussion);

  //   await authorBrowserProposalPage.nextStatusButton.click();
  //   await authorBrowserProposalPage.confirmStatusButton.click();
  //   await expect(authorBrowserProposalPage.currentStatus).toHaveText(PROPOSAL_STATUS_LABELS.discussion);
  // });
  // test('A proposalAuthor can move feedback to In Review', async () => {
  //   await expect(authorBrowserProposalPage.nextStatusButton).toHaveText(PROPOSAL_STATUS_LABELS.review);
  //   await authorBrowserProposalPage.nextStatusButton.click();
  //   await authorBrowserProposalPage.confirmStatusButton.click();
  //   await expect(authorBrowserProposalPage.currentStatus).toHaveText(PROPOSAL_STATUS_LABELS.review);
  // });

  // test('A reviewer can move feedback to Reviewed', async ({ proposalPage }) => {
  //   await loginBrowserUser({
  //     browserPage: proposalPage.page,
  //     userId: proposalReviewer.id
  //   });
  //   await proposalPage.goToPage({ domain: space.domain, path: pagePath });
  //   await proposalPage.waitForDocumentPage({ domain: space.domain, path: pagePath });

  //   await expect(proposalPage.nextStatusButton).toHaveText(PROPOSAL_STATUS_LABELS.reviewed);
  //   await proposalPage.nextStatusButton.click();
  //   await proposalPage.confirmStatusButton.click();
  //   await expect(proposalPage.currentStatus).toHaveText(PROPOSAL_STATUS_LABELS.reviewed);
  // });

  // test('A proposal author can create a vote', async () => {
  //   await authorBrowserProposalListPage.page.reload();
  //   await expect(authorBrowserProposalPage.nextStatusButton).toHaveText(PROPOSAL_STATUS_LABELS.vote_active);
  //   await authorBrowserProposalPage.nextStatusButton.click();
  //   await authorBrowserProposalPage.confirmStatusButton.click();
  //   await authorBrowserProposalPage.createVoteButton.click();
  //   await expect(authorBrowserProposalPage.voteContainer).toBeVisible();
  // });
});
