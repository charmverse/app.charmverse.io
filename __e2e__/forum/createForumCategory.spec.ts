import { test as base, expect } from '@playwright/test';

import { baseUrl } from 'config/constants';
import { prisma } from 'db';

import { ForumHomePage } from '../po/forumHome.po';
import { createUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';
import { mockWeb3 } from '../utils/web3';

type Fixtures = {
  forumHomePage: ForumHomePage;
};

const test = base.extend<Fixtures>({
  forumHomePage: ({ page }, use) => use(new ForumHomePage(page))
});

test('add forum category - navigate to forum and add a forum category', async ({ page, forumHomePage }) => {
  const { space, address, privateKey, pages, user } = await createUserAndSpace({
    browserPage: page,
    permissionConfigurationMode: 'collaborative',
    isNew: false
  });

  await login({
    page,
    userId: user.id
  });

  await forumHomePage.goToForumHome(space.domain);

  await forumHomePage.page.waitForTimeout(2000);

  await forumHomePage.page.press('data-test=member-onboarding-form', 'Escape');

  await expect(forumHomePage.addCategoryButton).toBeVisible();

  await forumHomePage.addCategoryButton.click();

  await expect(forumHomePage.addCategoryInput).toBeVisible();

  const newCategoryName = 'New category name';

  await forumHomePage.addCategoryInput.fill(newCategoryName);

  await forumHomePage.confirmNewCategoryButton.click();

  const category = await prisma.postCategory.findUnique({
    where: {
      spaceId_name: {
        spaceId: space.id,
        name: newCategoryName
      }
    }
  });

  const newCategoryMenuOption = forumHomePage.categoryLocator(category?.id as string);

  await expect(newCategoryMenuOption).toBeVisible();

  await newCategoryMenuOption.click();

  await forumHomePage.waitForCategory({ domain: space.domain, path: category?.path as string });
});
