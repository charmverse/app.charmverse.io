import type { Page, Proposal, ProposalCategory, Space, User } from '@charmverse/core/prisma';
import { testUtilsProposals } from '@charmverse/core/test';
import { test as base, expect } from '@playwright/test';
import { DocumentPage } from '__e2e__/po/document.po';
import { PagePermissionsDialog } from '__e2e__/po/pagePermissions.po';
import { ProposalsListPage } from '__e2e__/po/proposalsList.po';
import { logout } from '__e2e__/utils/session';

import { randomETHWalletAddress } from 'testing/generateStubs';

import {
  createUser,
  createUserAndSpace,
  generateSpaceRole,
  generateUser,
  loginBrowserUser,
  logoutBrowserUser
} from '../../utils/mocks';

type Fixtures = {
  proposalListPage: ProposalsListPage;
  documentPage: DocumentPage;
  pagePermissions: PagePermissionsDialog;
};

const test = base.extend<Fixtures>({
  proposalListPage: ({ page }, use) => use(new ProposalsListPage(page)),
  documentPage: ({ page }, use) => use(new DocumentPage(page)),
  pagePermissions: ({ page }, use) => use(new PagePermissionsDialog(page))
});

let space: Space;
let spaceAdmin: User;
let proposalAuthor: User;
let visibleProposalCategory: ProposalCategory;
let hiddenProposalCategory: ProposalCategory;
let draftProposal: Proposal;
let discussionProposal: Proposal & { page: Page };
let hiddenProposal: Proposal;

let publicLink: string;

test.describe.serial('View proposal', () => {
  test('Proposal author can view their own draft proposal and other accessible proposals', async ({
    page,
    proposalListPage
  }) => {
    // Initial setup
    const generated = await createUserAndSpace({
      browserPage: page,
      permissionConfigurationMode: 'collaborative'
    });

    space = generated.space;
    spaceAdmin = generated.user;

    hiddenProposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id,
      title: 'Invisible Proposals'
    });

    visibleProposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id,
      title: 'Proposals',
      proposalCategoryPermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'space', id: space.id }
        }
      ]
    });

    await logout({ page });

    proposalAuthor = await createUser({
      address: randomETHWalletAddress(),
      browserPage: page
    });

    await generateSpaceRole({
      spaceId: space.id,
      userId: proposalAuthor.id,
      isAdmin: false,
      isOnboarded: true
    });

    draftProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      proposalStatus: 'draft',
      categoryId: visibleProposalCategory.id
    });

    discussionProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      proposalStatus: 'discussion',
      categoryId: visibleProposalCategory.id
    });

    hiddenProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: spaceAdmin.id,
      proposalStatus: 'discussion',
      categoryId: hiddenProposalCategory.id
    });

    // Finish setup start interacting with the app
    await proposalListPage.goToHomePage();

    await proposalListPage.getSidebarLink('proposals').click();

    await proposalListPage.waitForProposalsList(space.domain);

    const draftRow = proposalListPage.getProposalRowLocator(draftProposal.id);
    const discussionRow = proposalListPage.getProposalRowLocator(discussionProposal.id);
    const hiddenRow = proposalListPage.getProposalRowLocator(hiddenProposal.id);

    await expect(draftRow).toBeVisible();
    await expect(discussionRow).toBeVisible();
    await expect(hiddenRow).not.toBeVisible();
  });

  test('Space member can see visible proposal categories', async ({ proposalListPage, page }) => {
    await loginBrowserUser({
      browserPage: page,
      userId: proposalAuthor.id
    });

    await proposalListPage.goToHomePage();

    await proposalListPage.getSidebarLink('proposals').click();
    await proposalListPage.waitForProposalsList(space.domain);

    const categoriesDropDown = proposalListPage.getProposalCategoryListButtonLocator();

    await page.pause();

    await expect(categoriesDropDown).toBeVisible();

    await categoriesDropDown.click();

    const visibleCategoryButton = proposalListPage.getProposalCategoryLocator(visibleProposalCategory.id);
    const hiddenCategoryButton = proposalListPage.getProposalCategoryLocator(hiddenProposalCategory.id);

    await expect(visibleCategoryButton).toBeVisible();
    await expect(hiddenCategoryButton).not.toBeVisible();
  });

  test('Space member can see proposals but not drafts', async ({ proposalListPage }) => {
    const spaceMember = await generateUser();

    await generateSpaceRole({
      spaceId: space.id,
      userId: spaceMember.id
    });
    await loginBrowserUser({
      browserPage: proposalListPage.page,
      userId: spaceMember.id
    });

    await proposalListPage.goToHomePage();
    await proposalListPage.getSidebarLink('proposals').click();
    await proposalListPage.waitForProposalsList(space.domain);

    // Check the rows content
    const draftRow = proposalListPage.getProposalRowLocator(draftProposal.id);
    const discussionRow = proposalListPage.getProposalRowLocator(discussionProposal.id);
    await expect(draftRow).not.toBeVisible();
    await expect(discussionRow).toBeVisible();
  });
  test('Proposal can be edited by the author and made public', async ({
    page,
    proposalListPage,
    documentPage,
    pagePermissions
  }) => {
    // Initial setup
    await loginBrowserUser({
      browserPage: page,
      userId: proposalAuthor.id
    });

    // Finish setup start interacting with the app
    await proposalListPage.goToHomePage(space.domain);

    await proposalListPage.getSidebarLink('proposals').click();

    await proposalListPage.waitForProposalsList(space.domain);

    // Select the row and open the page
    // Needed to reveal the button
    await proposalListPage.getProposalRowLocator(discussionProposal.id).hover();

    await proposalListPage.getProposalRowOpenLocator(discussionProposal.id).click();

    await expect(proposalListPage.dialog).toBeVisible();

    await expect(proposalListPage.openAsPageButton).toBeVisible();

    await proposalListPage.openAsPageButton.click({ force: true });

    // Check we can see the contents
    await proposalListPage.waitForDocumentPage({
      domain: space.domain,
      path: discussionProposal.page.path
    });

    await expect(documentPage.charmEditor).toBeVisible();

    await page.waitForTimeout(3000);

    const isEditable = await documentPage.isPageEditable();

    await expect(isEditable).toBe(true);

    // Start sharing flow
    await pagePermissions.permissionDialog.click();

    await expect(pagePermissions.publicShareToggle).toBeVisible();

    await pagePermissions.togglePageIsPublic();
    await expect(pagePermissions.pageShareLink).toBeVisible();

    const shareLink = await pagePermissions.getPageShareLinkValue();

    expect(shareLink).not.toBe(null);

    publicLink = shareLink as string;
  });

  test('Public proposal can be seen by people outside the space', async ({ page, proposalListPage, documentPage }) => {
    await logoutBrowserUser({
      browserPage: page
    });

    await page.goto(publicLink);

    // Check we can see the contents
    await proposalListPage.waitForDocumentPage({
      domain: space.domain,
      path: discussionProposal.page.path
    });

    await expect(documentPage.documentTitle).toBeVisible();

    const title = await documentPage.documentTitle.allInnerTexts();

    expect(title[0].trim()).toBe(discussionProposal.page.title);

    await expect(documentPage.charmEditor).toBeVisible();

    await page.waitForTimeout(3000);

    const isEditable = await documentPage.isPageEditable();

    await expect(isEditable).toBe(false);
  });
});
