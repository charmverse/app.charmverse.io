import type { Post, PostCategory, Space, User } from '@charmverse/core/prisma';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import { generateForumPost, generatePostCategory } from '@packages/testing/utils/forums';
import { expect, test as base } from '@playwright/test';

import { ForumHomePage } from '../po/forumHome.po';
import { createUser, createUserAndSpace, generateSpaceRole } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  forumHomePage: ForumHomePage;
};

const test = base.extend<Fixtures>({
  forumHomePage: ({ page }, use) => use(new ForumHomePage(page))
});

let space: Space;
let adminUser: User;
let memberUser: User;
let hiddenCategory: PostCategory;
let hiddenPost: Post;

test.describe.serial('Update category permissions', () => {
  test('hidden category - member user cannot view a category without correct permissions', async ({
    page,
    forumHomePage
  }) => {
    // Initial setup
    const generated = await createUserAndSpace({
      browserPage: page,
      permissionConfigurationMode: 'collaborative'
    });

    adminUser = generated.user;
    space = generated.space;

    memberUser = await createUser({
      browserPage: page,
      address: randomETHWalletAddress()
    });

    await generateSpaceRole({
      spaceId: space.id,
      userId: memberUser.id,
      isAdmin: false
    });

    const categoryName = 'Hidden category';

    hiddenCategory = await generatePostCategory({
      spaceId: space.id,
      name: categoryName
    });

    const postName = 'Post in hidden category';

    hiddenPost = await generateForumPost({
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: hiddenCategory.id,
      title: postName
    });
    await login({
      page,
      userId: memberUser.id
    });

    // Start the navigation steps

    await forumHomePage.goToForumHome(space.domain);
    // Login as user and not find the forum category or the post

    const category = forumHomePage.getCategoryLocator(hiddenCategory.id);

    await expect(category).not.toBeVisible({
      timeout: 3000
    });

    const postCard = forumHomePage.getPostCardLocator(hiddenPost.id);

    await expect(postCard).not.toBeVisible({
      timeout: 3000
    });
  });

  test('manage category permissions - admin user can configure permissions for a category', async ({
    page,
    forumHomePage
  }) => {
    await login({
      page,
      userId: adminUser.id
    });

    await forumHomePage.goToForumHome(space.domain);
    const category = forumHomePage.getCategoryLocator(hiddenCategory.id);
    await category.hover();

    const categoryMenu = forumHomePage.getCategoryContextMenuLocator(hiddenCategory.id);
    await expect(categoryMenu).toBeVisible();

    await categoryMenu.click();

    const managePermissions = forumHomePage.getCategoryManagePermissionsLocator(hiddenCategory.id);
    await expect(managePermissions).toBeVisible();
    await managePermissions.click();

    await expect(forumHomePage.categoryPermissionsDialog).toBeVisible();

    const select = forumHomePage.spaceCategoryPermissionSelect;
    await expect(select).toBeVisible();
    await select.click();

    const option = await page.getByRole('option', { name: 'View' });
    await expect(option).toBeVisible();
    await option.click();

    await forumHomePage.closeModalButton.click();

    await expect(forumHomePage.categoryPermissionsDialog).not.toBeVisible();
  });

  test('hidden category - member user can now view the category once an admin has provided permissions for the space', async ({
    page,
    forumHomePage
  }) => {
    await login({
      page,
      userId: memberUser.id
    });
    // Start the navigation steps
    await forumHomePage.goToForumHome(space.domain);

    const category = forumHomePage.getCategoryLocator(hiddenCategory.id);

    await expect(category).toBeVisible();

    await category.click();

    await forumHomePage.waitForCategory({ domain: space.domain, path: hiddenCategory.path as string });

    const postCard = forumHomePage.getPostCardLocator(hiddenPost.id);

    await expect(postCard).toBeVisible({
      timeout: 3000
    });
  });
});
