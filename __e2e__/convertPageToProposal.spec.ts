import { test as base, expect } from '@playwright/test';
import { PageHeader } from '__e2e__/po/pageHeader.po';

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

test.skip('convert page to proposal - create a page, convert that page to proposal and assert editor is readonly with proposal banner', async ({
  documentPage,
  pageHeader
}) => {
  const { space, user, page: generatedPage } = await generateUserAndSpace({ isAdmin: true });

  await login({
    page: documentPage.page,
    userId: user.id
  });

  await documentPage.goToPage({
    domain: space.domain,
    path: generatedPage.path
  });

  await pageHeader.convertToProposal();

  // Go back to page to assert that we have the proposal conversion banner and editor is readonly
  await documentPage.goToPage({
    domain: space.domain,
    path: generatedPage.path
  });

  await expect(documentPage.proposalBanner).toBeVisible();

  const isEditable = await documentPage.isPageEditable();

  expect(isEditable).toBe(false);
});
