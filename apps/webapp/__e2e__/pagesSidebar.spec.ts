import { baseUrl } from '@packages/config/constants';
import { expect } from '@playwright/test';

import { test } from './testWithFixtures';
import { generateUserAndSpace } from './utils/mocks';
import { generatePage } from './utils/pages';
import { login } from './utils/session';

test.describe('Navigation sidebar', async () => {
  test('Shows the correct pages', async ({ page, pagesSidebar }) => {
    const { space, user } = await generateUserAndSpace({
      isAdmin: false
    });

    const normalPage = await generatePage({
      spaceId: space.id,
      createdBy: user.id
    });

    // card page ids are not returned from permissions api and will be hidden
    const cardPage = await generatePage({
      spaceId: space.id,
      createdBy: user.id,
      type: 'card'
    });

    // children of card pages should not be visible
    const cardPageChild = await generatePage({
      spaceId: space.id,
      createdBy: user.id,
      parentId: cardPage.id
    });

    // hidden via permissions
    const hiddenPage = await generatePage({
      spaceId: space.id,
      createdBy: user.id,
      pagePermissions: []
    });

    // children of hidden pages should appear at the top of navigation
    const hiddenPageChild = await generatePage({
      spaceId: space.id,
      createdBy: user.id,
      parentId: hiddenPage.id
    });

    await await login({ page, userId: user.id });
    await pagesSidebar.goToHomePage(space.domain);

    // Add the database page from the sidebar
    await expect(pagesSidebar.pagesSidebar).toBeVisible();

    const domain = space.domain;
    const targetPage = `${baseUrl}/${domain}`;

    await page.goto(targetPage);

    await expect(pagesSidebar.getSidebarPageLink(normalPage.id)).toBeVisible();
    await expect(pagesSidebar.getSidebarPageLink(cardPage.id)).not.toBeVisible();
    await expect(pagesSidebar.getSidebarPageLink(cardPageChild.id)).not.toBeVisible();
    await expect(pagesSidebar.getSidebarPageLink(hiddenPage.id)).not.toBeVisible();
    await expect(pagesSidebar.getSidebarPageLink(hiddenPageChild.id)).toBeVisible();
  });
});
