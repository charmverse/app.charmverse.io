import type { Page, Proposal, Space, User } from '@charmverse/core/prisma';
import { testUtilsProposals } from '@charmverse/core/test';
import { expect } from '@playwright/test';
import { DocumentPage } from '__e2e__/po/document.po';
import { PagePermissionsDialog } from '__e2e__/po/pagePermissions.po';
import { ProposalsListPage } from '__e2e__/po/proposalsList.po';

import { test } from '../testWithFixtures';
import { createUserAndSpace, logoutBrowserUser } from '../utils/mocks';

let space: Space;
let proposalAuthor: User;
let draftProposal: Proposal & { page: Page };
let discussionProposal: Proposal & { page: Page };

test.describe.serial('View proposal - public space', () => {
  test('People outside the space can always view proposals at discussion stage and beyond', async ({
    page,
    documentPage
  }) => {
    // Initial setup
    const generated = await createUserAndSpace({
      browserPage: page,
      permissionConfigurationMode: 'collaborative',
      paidTier: 'free'
    });

    space = generated.space;
    proposalAuthor = generated.user;

    draftProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      proposalStatus: 'draft'
    });

    discussionProposal = await testUtilsProposals.generateProposal({
      spaceId: space.id,
      userId: proposalAuthor.id,
      proposalStatus: 'published'
    });

    // Finish setup start interacting with the app

    await logoutBrowserUser({
      browserPage: page
    });

    await documentPage.goToPage({
      domain: space.domain,
      path: discussionProposal.page.path
    });

    // Check the proposal shows up
    await expect(documentPage.documentTitle).toBeVisible();

    const title = await documentPage.documentTitle.allInnerTexts();

    expect(title[0].trim()).toBe(discussionProposal.page.title);

    await expect(documentPage.charmEditor).toBeVisible();

    await page.waitForTimeout(3000);

    const isEditable = await documentPage.isPageEditable();

    await expect(isEditable).toBe(false);
  });

  test('Public user cannot see draft proposals', async ({ documentPage }) => {
    await documentPage.goToPage({
      domain: space.domain,
      path: draftProposal.page.path
    });

    // Check the proposal shows up
    await expect(documentPage.documentTitle).not.toBeVisible({ timeout: 5000 });
  });
});
