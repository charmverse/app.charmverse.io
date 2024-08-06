import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsProposals, testUtilsSpaces } from '@charmverse/core/test';
import { expect, test } from '__e2e__/testWithFixtures';
import { v4 as uuid } from 'uuid';

import { generateUserAndSpace, loginBrowserUser } from '../utils/mocks';

test.describe('Archive Proposal', () => {
  test('Archive proposal and assert all actions are disabled, and proposal is not visible in the proposals list', async ({
    proposalsListPage: proposalListPage,
    documentPage,
    proposalPage,
    page
  }) => {
    const { space, user: admin } = await generateUserAndSpace({
      isAdmin: true,
      spaceDomain: `cvt-${uuid()}`
    });

    await testUtilsSpaces.addSpaceOperations({
      forSpaceId: space.id,
      spaceId: space.id,
      operations: ['createProposals']
    });

    const proposal = await testUtilsProposals.generateProposal({
      proposalStatus: 'published',
      spaceId: space.id,
      userId: admin.id,
      authors: [admin.id],
      evaluationInputs: [
        {
          evaluationType: 'feedback',
          title: 'Feedback',
          permissions: [
            {
              assignee: {
                group: 'all_reviewers'
              },
              operation: 'comment'
            }
          ],
          reviewers: []
        },
        {
          evaluationType: 'pass_fail',
          title: 'Pass/Fail',
          permissions: [
            {
              assignee: {
                group: 'all_reviewers'
              },
              operation: 'comment'
            },
            {
              assignee: {
                group: 'space_member'
              },
              operation: 'view'
            }
          ],
          reviewers: [
            {
              group: 'user',
              id: admin.id
            }
          ]
        }
      ]
    });

    // Initial setup
    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: admin.id
    });

    await documentPage.goToPage({
      domain: space.domain,
      path: proposal.page.path
    });

    await documentPage.waitForDocumentPage({
      domain: space.domain,
      path: proposal.page.path
    });

    await expect(documentPage.charmEditor).toBeVisible();

    await proposalPage.pageTopLevelMenu.click();

    await expect(proposalPage.archiveProposalAction).toBeEnabled();

    await Promise.all([page.waitForResponse('**/api/proposals/*/archive'), proposalPage.archiveProposalAction.click()]);

    await page.reload();

    await expect(documentPage.charmEditor).toHaveAttribute('contenteditable', 'false');

    const updatedProposal = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      },
      select: {
        archived: true
      }
    });

    expect(updatedProposal.archived).toBe(true);

    await expect(proposalPage.passFeedbackEvaluation).toBeDisabled();

    // Visit proposals list page and assert archived proposal is not visible

    await proposalListPage.goToProposals(space.domain);

    await proposalListPage.waitForProposalsList();

    await expect(proposalListPage.getProposalRowLocator(proposal.id)).not.toBeVisible();

    await documentPage.goToPage({
      domain: space.domain,
      path: proposal.page.path
    });

    await documentPage.waitForDocumentPage({
      domain: space.domain,
      path: proposal.page.path
    });

    await proposalPage.toggleArchiveProposal();

    await proposalPage.page.waitForTimeout(500);

    const updatedProposal2 = await prisma.proposal.findUniqueOrThrow({
      where: {
        id: proposal.id
      },
      select: {
        archived: true
      }
    });

    expect(updatedProposal2.archived).toBe(false);

    await page.reload();

    await expect(proposalPage.passFeedbackEvaluation).not.toBeDisabled();
    await expect(documentPage.charmEditor).toHaveAttribute('contenteditable', 'true');
  });
});
