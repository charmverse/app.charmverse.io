import { baseUrl } from '@packages/config/constants';
import { createPage } from '@packages/testing/setupDatabase';
import { expect } from '@playwright/test';
import type { DocumentPage } from '__e2e__/po/document.po';
import { generateUserAndSpace, loginBrowserUser } from '__e2e__/utils/mocks';

import { test } from '../utils/test';

type Fixtures = {
  documentPage: DocumentPage;
};

test('Create linkedPage using inline palette in the charmEditor', async ({ documentPage }) => {
  const { space, user, page: generatedPage } = await generateUserAndSpace({ isAdmin: true });

  const linkedPage = await createPage({
    createdBy: user.id,
    spaceId: space.id,
    title: 'Linked Page',
    pagePermissions: [
      {
        spaceId: space.id,
        permissionLevel: 'full_access'
      }
    ]
  });

  await loginBrowserUser({
    browserPage: documentPage.page,
    userId: user.id
  });

  await documentPage.goToPage({
    domain: space.domain,
    path: generatedPage.path
  });

  await expect(documentPage.charmEditor).toBeVisible();

  await documentPage.typeText('/link');

  const inlinePaletteLinkToPageLocator = documentPage.page.locator('[data-id="link-to-page"]');

  await inlinePaletteLinkToPageLocator.click();

  await documentPage.typeText('Linked Page');

  const linkedPageInlinePaletteLocator = documentPage.page.locator(`[data-test="page-option-${linkedPage.id}"]`);

  await linkedPageInlinePaletteLocator.click();

  const linkedPageCharmEditorLocator = documentPage.page.locator(`[data-id="${linkedPage.id}"]`);

  await linkedPageCharmEditorLocator.click();

  await documentPage.page.waitForURL(`${baseUrl}/${space.domain}/${linkedPage.path}`);

  await expect(documentPage.charmEditor).toBeVisible();
});
