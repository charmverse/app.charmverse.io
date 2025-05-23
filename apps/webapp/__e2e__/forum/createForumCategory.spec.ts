import { expect } from '@playwright/test';

import { ForumHomePage } from '../po/forumHome.po';
import { test } from '../testWithFixtures';
import { createUserAndSpace } from '../utils/mocks';
import { login } from '../utils/session';

test('add forum category - navigate to forum and add a forum category', async ({ page, forumHomePage }) => {
  const { space, user } = await createUserAndSpace({
    browserPage: page,
    permissionConfigurationMode: 'collaborative'
  });

  await login({
    page,
    userId: user.id
  });

  await forumHomePage.goToForumHome(space.domain);

  await expect(forumHomePage.addCategoryButton).toBeVisible();

  await forumHomePage.addCategoryButton.click();

  await expect(forumHomePage.addCategoryInput).toBeVisible();

  const newCategoryName = 'New category name';

  await forumHomePage.addCategoryInput.fill(newCategoryName);

  const category = await forumHomePage.submitNewCategory();
  const newCategoryMenuOption = forumHomePage.getCategoryLocator(category?.id as string);

  await expect(newCategoryMenuOption).toBeVisible();

  await newCategoryMenuOption.click();

  await forumHomePage.waitForCategory({ domain: space.domain, path: category?.path as string });
});
