import type { Page, User } from '@charmverse/core/prisma';
import type { Space } from '@charmverse/core/prisma-client';
import { testUtilsUser } from '@charmverse/core/test';
import { test as base, expect } from '@playwright/test';
import { PagesSidebarPage } from '__e2e__/po/pagesSiderbar.po';

import { loginBrowserUser } from '../utils/mocks';

type Fixtures = {
  pagesSidebar: PagesSidebarPage;
  databasePage: null;
};

const test = base.extend<Fixtures>({
  pagesSidebar: ({ page }, use) => use(new PagesSidebarPage(page))
});

// Will be set by the first test
let spaceUser: User;
let space: Space;
let databasePagePath: string;

test.beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({
    isAdmin: true
  });

  spaceUser = generated.user;
  space = generated.space;
});

test.describe.serial('Edit database select properties', async () => {
  test('create a board', async ({ page, pagesSidebar }) => {
    // Arrange ------------------
    await loginBrowserUser({
      browserPage: page,
      userId: spaceUser.id
    });

    await pagesSidebar.goToHomePage(space.domain);

    await expect(pagesSidebar.pagesSidebar).toBeVisible();

    await pagesSidebar.pagesSidebar.hover();

    await pagesSidebar.pagesSidebarAddPageButton.click();

    await expect(pagesSidebar.pagesSidebarSelectAddDatabaseButton).toBeVisible();

    await pagesSidebar.pagesSidebarSelectAddDatabaseButton.click();

    await page.pause();

    await expect(pagesSidebar.databasePage).toBeVisible();

    databasePagePath = page.url();
  });

  // test('edit a board', async ({ page, globalPage }) => {
  //   // Arrange ------------------
  //   await loginBrowserUser({
  //     browserPage: page,
  //     userId: spaceUser.id
  //   });

  //   await expect(globalPage.pagesSidebar).toBeVisible();

  //   await globalPage.pagesSidebar.click();

  //   await expect(globalPage.pagesSidebarSelectAddDatabaseButton).toBeVisible();

  //   await globalPage.pagesSidebarSelectAddDatabaseButton.click();

  //   await expect(globalPage.databasePage).toBeVisible();
  // });
});
