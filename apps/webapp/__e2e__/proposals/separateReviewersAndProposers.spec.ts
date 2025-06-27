import type { Page, Proposal, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import type { ProposalWorkflowTyped } from '@packages/core/proposals';
import { getCurrentEvaluation } from '@packages/core/proposals';
import { getDefaultEvaluation } from '@packages/lib/proposals/workflows/defaultEvaluation';
import { generateUserAndSpace, loginBrowserUser } from '__e2e__/utils/mocks';
import { expect, test } from '__e2e__/utils/test';

test.describe.serial('Have separate approver from reviewers', async () => {
  let space: Space;
  let admin: User;
  let author: User;
  let reviewer: User;
  let approver: User;

  let proposal: Proposal & { page: Page };

  let rubricWorkflow: ProposalWorkflowTyped;

  test.beforeAll(async () => {
    ({ user: admin, space } = await generateUserAndSpace({
      isAdmin: true,
      memberSpacePermissions: ['createProposals']
    }));
    reviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
    approver = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
    author = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });

    rubricWorkflow = (await prisma.proposalWorkflow.create({
      data: {
        index: 0,
        title: 'Rubric Workflow',
        evaluations: [getDefaultEvaluation({ title: 'Rubric', type: 'rubric' })],
        spaceId: space.id
      } as ProposalWorkflowTyped
    })) as ProposalWorkflowTyped;

    await prisma.spaceRole.updateMany({
      where: {
        spaceId: space.id,
        userId: {
          in: [reviewer.id, approver.id, author.id]
        }
      },
      data: {
        onboarded: true
      }
    });

    proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: author.id,
      proposalStatus: 'draft',
      workflowId: rubricWorkflow.id,
      authors: [author.id],
      evaluationInputs: [
        {
          evaluationType: 'rubric',
          rubricCriteria: [
            {
              title: 'Criteria 1',
              description: 'Description 1',
              parameters: { type: 'score', min: 0, max: 20 }
            }
          ],
          permissions: [{ operation: 'view', assignee: { group: 'space_member' } }],
          reviewers: [{ group: 'user', id: reviewer.id }]
        }
      ]
    });
  });

  test('Approver can be configured for the proposal', async ({ page, proposalPage }) => {
    await loginBrowserUser({ browserPage: page, userId: author.id });

    await proposalPage.goToPage({ domain: space.domain, path: proposal.page.path });

    await proposalPage.selectApprover.click();

    await proposalPage.getSelectOption(approver.id).click();

    await expect(proposalPage.publishNewProposalButton).toBeEnabled();

    await Promise.all([
      page.waitForResponse('**/api/proposals/*/publish'),
      proposalPage.publishNewProposalButton.click()
    ]);

    const configuredProposal = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      },
      select: {
        status: true,
        evaluations: {
          select: {
            reviewers: true,
            evaluationApprovers: true
          }
        }
      }
    });

    expect(configuredProposal.status).toEqual('published');

    expect(configuredProposal.evaluations[0].reviewers).toHaveLength(1);
    expect(configuredProposal.evaluations[0].evaluationApprovers).toHaveLength(1);

    expect(configuredProposal.evaluations[0].reviewers[0].userId).toEqual(reviewer.id);
    expect(configuredProposal.evaluations[0].evaluationApprovers[0].userId).toEqual(approver.id);
  });

  test('Reviewer can score the proposal but not pass the step', async ({ page, proposalPage, globalPage }) => {
    await loginBrowserUser({ browserPage: page, userId: reviewer.id });

    await proposalPage.goToPage({ domain: space.domain, path: proposal.page.path });

    // Move beyond rubric step
    await proposalPage.rubricCriteriaScore.fill('10');
    await proposalPage.rubricCriteriaComment.fill('Good job');
    // Confirm rubric results
    await proposalPage.saveRubricAnswers.click();

    await Promise.all([
      page.waitForResponse('**/api/proposals/*/rubric-answers'),
      proposalPage.confirmStatusButton.click()
    ]);

    await proposalPage.rubricStepDecisionTab.click();
    await expect(proposalPage.passEvaluationButton).not.toBeVisible();

    const proposalAfterUpdate = await prisma.proposal.findFirstOrThrow({
      where: {
        id: proposal.id
      },
      select: {
        evaluations: {
          orderBy: {
            index: 'asc'
          }
        }
      }
    });

    const current = getCurrentEvaluation(proposalAfterUpdate.evaluations);

    expect(current?.index).toEqual(0);
  });

  test('Approver can pass the step, but not review the rubric', async ({ page, proposalPage, globalPage }) => {
    await loginBrowserUser({ browserPage: page, userId: approver.id });

    await proposalPage.goToPage({ domain: space.domain, path: proposal.page.path });

    // Approver can pass, but not review the rubric
    await expect(proposalPage.rubricCriteriaScore).toBeDisabled();

    await proposalPage.rubricStepDecisionTab.click();
    await expect(proposalPage.passEvaluationButton).toBeEnabled();

    await Promise.all([
      page.waitForResponse('**/api/proposals/*/submit-result'),
      proposalPage.passEvaluationButton.click(),
      proposalPage.confirmStatusButton.click()
    ]);

    const updatedProposal = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      },
      select: {
        evaluations: true
      }
    });

    expect(updatedProposal.evaluations[0].result).toEqual('pass');
  });
});
