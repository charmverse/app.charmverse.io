import type { Page, Proposal, ProposalCategory, Space, User } from '@charmverse/core/prisma';
import { testUtilsProposals } from '@charmverse/core/test';
import { test as base, expect } from '@playwright/test';
import { ProposalPage } from '__e2e__/po/proposalPage.po';
import { ProposalsListPage } from '__e2e__/po/proposalsList.po';

import type { PageWithProposal } from 'lib/pages';

import { generateUserAndSpace, loginBrowserUser } from '../utils/mocks';

type Fixtures = {
  proposalListPage: ProposalsListPage;
  proposalPage: ProposalPage;
};

const test = base.extend<Fixtures>({
  proposalListPage: ({ page }, use) => use(new ProposalsListPage(page)),
  proposalPage: ({ page }, use) => use(new ProposalPage(page))
});
test.describe.serial('Can step through a entire proposal flow', () => {
  test('An admin creates a proposal', async ({ proposalListPage, proposalPage }) => {
    // Initial setup
    const { space, user: spaceAdmin } = await generateUserAndSpace({});

    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: spaceAdmin.id
    });

    const category = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id,
      title: 'General',
      proposalCategoryPermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'space', id: space.id }
        }
      ]
    });

    await proposalListPage.goToProposals(space.domain);
    await proposalListPage.waitForProposalsList();
    await expect(proposalListPage.emptyState).toBeVisible();
    await proposalListPage.clickNewProposalDialog();

    await proposalPage.waitForDialog();
    await expect(proposalPage.saveDraftButton).toBeDisabled();

    // enter required fields
    await proposalPage.documentTitle.type('Proposal title');
    await proposalPage.categorySelect.click();
    await proposalPage.getCategoryOption(category.id).click();
    await proposalPage.charmEditor.scrollIntoViewIfNeeded();
    await proposalPage.charmEditor.type('Proposal content');

    // save draft
    await expect(proposalPage.saveDraftButton).toBeEnabled();
    await proposalPage.saveDraftButton.click();

    const response = await proposalPage.waitForJsonResponse<PageWithProposal>('**/api/proposals');

    // verify we are on the saved view
    await expect(proposalPage.openAsPageButton).toBeVisible();

    // verify that the page list was updated
    await proposalPage.closeDialog();
    await expect(proposalListPage.emptyState).not.toBeVisible();
    const proposalRow = proposalListPage.getProposalRowLocator(response.proposal.id);
    await expect(proposalRow).toBeVisible();
  });
});
