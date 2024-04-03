import type {
  Page,
  Proposal,
  ProposalEvaluation,
  ProposalEvaluationPermission,
  ProposalReviewer,
  Role,
  Space,
  User
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { ProposalWorkflowTyped } from '@charmverse/core/proposals';
import { testUtilsProposals, testUtilsUser, testUtilsMembers } from '@charmverse/core/test';
import { expect, test } from '__e2e__/testWithFixtures';
import { generateUserAndSpace, loginBrowserUser } from '__e2e__/utils/mocks';
import { optimism } from 'viem/chains';

import type { ProposalPendingReward } from 'lib/proposals/interfaces';
import { generateProposalWorkflow } from 'testing/utils/proposals';

test.describe('Duplicate a proposal template', async () => {
  let space: Space;
  let admin: User;
  let proposalWorkflow: ProposalWorkflowTyped;
  let proposalDBPage: Page;
  let proposalTemplate: Awaited<ReturnType<typeof testUtilsProposals.generateProposalTemplate>>;

  let secondProposalWorkflow: ProposalWorkflowTyped;
  let role: Role;

  test.beforeAll(async () => {
    // Generate a admin and a space for the test
    ({ user: admin, space } = await generateUserAndSpace({
      isAdmin: true,
      memberSpacePermissions: ['createProposals', 'reviewProposals']
    }));

    await generateProposalWorkflow({
      spaceId: space.id
    });

    proposalWorkflow = await generateProposalWorkflow({
      spaceId: space.id,
      evaluations: [{ type: 'pass_fail' }] // pass_fail requires reviewers to be set
    });
    role = await testUtilsMembers.generateRole({
      createdBy: admin.id,
      spaceId: space.id,
      roleName: 'Movie critics'
    });
    proposalTemplate = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      pageType: 'proposal_template',
      proposalStatus: 'published',
      userId: admin.id,
      title: 'Special template title',
      workflowId: proposalWorkflow.id,
      evaluationInputs: [
        {
          evaluationType: 'pass_fail',
          // this must match the workflow title or settings will be overwritten
          title: proposalWorkflow.evaluations[0].title,
          reviewers: [
            {
              group: 'role',
              id: role.id
            }
          ],
          permissions: []
        }
      ],
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            attrs: { track: [] },
            content: [{ text: 'This is a template description', type: 'text' }]
          }
        ]
      }
    });
    const evals = await prisma.proposalEvaluation.findMany({
      where: {
        proposalId: proposalTemplate.id
      },
      include: { reviewers: true }
    });

    proposalDBPage = await prisma.page.findFirstOrThrow({
      where: {
        id: proposalTemplate.id
      }
    });
  });

  test('Copies data from the original template', async ({ proposalsListPage, proposalPage, page }) => {
    await loginBrowserUser({ browserPage: page, userId: admin.id });
    await proposalsListPage.goToProposals(space.domain);

    // open template menu
    await proposalsListPage.proposalTemplateSelect.click();
    // open context menu
    await proposalsListPage.templateContextMenu.click();
    // select Duplicate action
    await proposalsListPage.duplicateTemplateButton.click();
    await proposalPage.waitForNewProposalPage(space.domain);

    await expect(proposalPage.charmEditor).toHaveText('This is a template description');

    // check workflow
    const workflowSelectTextContent = await proposalPage.workflowSelect.textContent();
    expect(workflowSelectTextContent).toBe(proposalWorkflow.title);

    const reviewerInputs = await proposalPage.getSelectedReviewers();
    await reviewerInputs.nth(0).waitFor();
    const reviewerInput = reviewerInputs.nth(0);

    await expect(reviewerInput).toHaveText(role.name);
  });
});
