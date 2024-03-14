import type { Page, Proposal, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentEvaluation } from '@charmverse/core/proposals';
import { testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import { generateUserAndSpace, loginBrowserUser } from '__e2e__/utils/mocks';
import { expect, test } from '__e2e__/utils/test';

test.describe('Go through full proposal flow', async () => {
  let space: Space;
  let admin: User;
  let reviewer: User;

  let proposal: Proposal & { page: Page };

  test.beforeAll(async () => {
    ({ user: admin, space } = await generateUserAndSpace({ isAdmin: true }));
    reviewer = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
    await prisma.spaceRole.update({
      where: {
        spaceUser: {
          spaceId: space.id,
          userId: reviewer.id
        }
      },
      data: {
        onboarded: true
      }
    });

    proposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: admin.id,
      proposalStatus: 'published',
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          permissions: [],
          reviewers: [{ group: 'user', id: reviewer.id }]
        },
        {
          evaluationType: 'pass_fail',
          permissions: [{ assignee: { group: 'current_reviewer' }, operation: 'move' }],
          reviewers: [{ group: 'user', id: reviewer.id }]
        },
        {
          evaluationType: 'rubric',
          rubricCriteria: [
            { title: 'Criteria 1', description: 'Description 1', parameters: { type: 'score', min: 0, max: 20 } }
          ],
          permissions: [{ assignee: { group: 'current_reviewer' }, operation: 'move' }],
          reviewers: [{ group: 'user', id: reviewer.id }]
        },
        {
          evaluationType: 'vote',
          voteSettings: {
            durationDays: 12,
            threshold: 90,
            type: 'SingleChoice',
            options: ['Yes', 'No'],
            maxChoices: 1,
            strategy: 'regular'
          },
          permissions: [{ assignee: { group: 'current_reviewer' }, operation: 'move' }],
          reviewers: [{ group: 'user', id: reviewer.id }]
        }
      ]
    });
  });

  test('reviewer can bring proposal to final state and back', async ({ page, proposalPage, globalPage }) => {
    await loginBrowserUser({ browserPage: page, userId: reviewer.id });

    await proposalPage.goToPage({ domain: space.domain, path: proposal.page.path });

    // Move beyond feedback step
    await proposalPage.passFeedbackEvaluation.click();

    // Move beyond pass_fail step
    await proposalPage.passEvaluationButton.click();

    // Move beyond rubric step
    await proposalPage.rubricCriteriaScore.fill('10');
    await proposalPage.rubricCriteriaComment.fill('Good job');
    // Confirm rubric results
    await proposalPage.saveRubricAnswers.click();
    await proposalPage.confirmStatusButton.click();

    // Confirm rubric is completed
    await proposalPage.passEvaluationButton.click();
    await proposalPage.confirmStatusButton.click();

    // Check we have arrived at vote step
    await expect(proposalPage.voteContainer).toBeVisible();

    // Move back
    await proposalPage.goBackButton.click();
    await proposalPage.confirmStatusButton.click();
    await page.waitForTimeout(500);

    await proposalPage.goBackButton.click();
    await proposalPage.confirmStatusButton.click();

    await page.waitForTimeout(500);

    await proposalPage.goBackButton.click();
    await proposalPage.confirmStatusButton.click();

    await page.waitForTimeout(500);

    await expect(proposalPage.goBackButton).toBeDisabled();

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
});
