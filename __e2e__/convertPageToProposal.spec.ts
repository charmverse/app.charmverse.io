import type { Browser } from '@playwright/test';
import { test as base, chromium, expect } from '@playwright/test';
import { PageHeader } from '__e2e__/po/pageHeader.po';

import { generateProposalCategory } from 'testing/utils/proposals';

import { DocumentPage } from './po/document.po';
import { generateUserAndSpace } from './utils/mocks';
import { login } from './utils/session';

type Fixtures = {
  documentPage: DocumentPage;
  pageHeader: PageHeader;
};

const test = base.extend<Fixtures>({
  pageHeader: ({ page }, use) => use(new PageHeader(page)),
  documentPage: ({ page }, use) => use(new DocumentPage(page))
});

test('convert page to proposal - create a page, convert that page to proposal and assert editor is readonly with proposal banner', async ({
  page,
  documentPage,
  pageHeader
}) => {
  const { space, user, page: generatedPage } = await generateUserAndSpace({ isAdmin: true });

  await login({
    page,
    userId: user.id
  });

  const proposalCategoryName = 'Example category';

  await generateProposalCategory({
    spaceId: space.id,
    title: proposalCategoryName
  });

  await documentPage.goToPage({
    domain: space.domain,
    path: generatedPage.path
  });

  await pageHeader.pageTopLevelMenu.click();

  const pageConvertProposalAction = page.locator('data-test=page-convert-proposal-action');
  await pageConvertProposalAction.click();

  // Go back to page to assert that we have the proposal conversion banner and editor is readonly
  await documentPage.goToPage({
    domain: space.domain,
    path: generatedPage.path
  });

  const isEditable = await documentPage.isPageEditable();

  expect(isEditable).toBe(false);

  const postProposalBanner = page.locator('data-test=proposal-banner');

  await expect(postProposalBanner).toBeVisible();
});
