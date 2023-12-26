import type {
  ProposalCategory,
  ProposalSystemRole,
  ProposalWorkflow,
  Role,
  Space,
  User
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { WorkflowEvaluationJson } from '@charmverse/core/proposals';
import { testUtilsMembers, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { expect } from '@playwright/test';
import { ProposalPage } from '__e2e__/po/proposalPage.po';
import { ProposalsListPage } from '__e2e__/po/proposalsList.po';
import { test } from '__e2e__/utils/test';
import { v4 as uuid } from 'uuid';

import { PROPOSAL_STATUS_LABELS } from 'lib/proposal/proposalStatusTransition';

import { generateUserAndSpace, loginBrowserUser } from '../utils/mocks';

test.describe.serial('Proposal Evaluation', () => {
  let space: Space;
  let admin: User;
  let proposalCategory: ProposalCategory;
  let role: Role;

  const proposalEvaluationPermissions: WorkflowEvaluationJson[] = [
    {
      id: uuid(),
      title: 'Feedback',
      permissions: [
        { systemRole: 'all_reviewers', operation: 'comment' },
        { operation: 'view', systemRole: 'space_member' }
      ],
      type: 'feedback'
    },
    {
      id: uuid(),
      title: 'Rubric',
      permissions: [
        { systemRole: 'all_reviewers', operation: 'comment' },
        { operation: 'view', systemRole: 'space_member' }
      ],
      type: 'rubric'
    },
    {
      id: uuid(),
      title: 'Review',
      permissions: [
        { systemRole: 'all_reviewers', operation: 'comment' },
        { operation: 'view', systemRole: 'space_member' }
      ],
      type: 'pass_fail'
    },
    {
      id: uuid(),
      title: 'Community Vote',
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

    await documentPage.documentTitle.locator('textarea').first().fill('Proposal title');

    await proposalPage.selectCategory(proposalCategory.id);

    // Workflow auto-selected when loading the proposal
    const workflowSelectTextContent = await proposalPage.workflowSelect.textContent();
    expect(workflowSelectTextContent).toBe(workflow.title);

    // Move into configuring the actual evaluation
    await expect(proposalPage.evaluationSettingsSidebar).toBeVisible();

    // Configure rubric
    await proposalPage.selectEvaluationReviewer('rubric', 'space_member' as ProposalSystemRole);

    await proposalPage.addRubricCriteriaButton.click();

    await proposalPage.editRubricCriteriaLabel.fill('Rubric criteria label');
    await proposalPage.editRubricCriteriaDescription.fill('Rubric criteria description');
    await proposalPage.editRubricCriteriaMinScore.fill('1');
    await proposalPage.editRubricCriteriaMaxScore.fill('10');

    // Configure review
    await proposalPage.selectEvaluationReviewer('pass_fail', role.id);

    // Configure vote
    await proposalPage.selectEvaluationReviewer('vote', 'space_member');

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
