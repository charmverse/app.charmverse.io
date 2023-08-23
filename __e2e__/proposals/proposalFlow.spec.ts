import type { Page, Proposal, ProposalCategory, Space, User } from '@charmverse/core/prisma';
import { testUtilsProposals } from '@charmverse/core/test';
import { test as base, expect } from '@playwright/test';
import type { PagePermissionsDialog } from '__e2e__/po/pagePermissions.po';
import { ProposalPage } from '__e2e__/po/proposalPage.po';
import { ProposalsListPage } from '__e2e__/po/proposalsList.po';

import {
  generateUserAndSpace,
  generateSpaceRole,
  generateUser,
  loginBrowserUser,
  logoutBrowserUser
} from '../utils/mocks';

type Fixtures = {
  proposalListPage: ProposalsListPage;
  proposalPage: ProposalPage;
};

const test = base.extend<Fixtures>({
  proposalListPage: ({ page }, use) => use(new ProposalsListPage(page)),
  proposalPage: ({ page }, use) => use(new ProposalPage(page))
});

let proposalAuthor: User;
let visibleProposalCategory: ProposalCategory;
let hiddenProposalCategory: ProposalCategory;
let draftProposal: Proposal;
let discussionProposal: Proposal & { page: Page };
let hiddenProposal: Proposal;

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
    await expect(proposalListPage.getEmptyStateLocator()).toBeVisible();
    await proposalListPage.clickNewProposalDialog();

    await proposalPage.waitForDialog();
    await proposalPage.clickSaveDraft();

    await proposalPage.closeDialog();
    await expect(proposalListPage.getEmptyStateLocator()).not.toBeVisible();
  });
});
