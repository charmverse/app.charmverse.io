import { expect, test as base } from '@playwright/test';
import type { PostCategory, PostCategoryPermissionLevel, Space, User } from '@prisma/client';

import { prisma } from 'db';
import { postCategoryPermissionLabels } from 'lib/permissions/forum/mapping';
import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
import { randomETHWalletAddress } from 'testing/generateStubs';
import { generateForumPost, generatePostCategory } from 'testing/utils/forums';

import { ForumHomePage } from '../po/forumHome.po';
import type { ForumPostPage } from '../po/forumPost.po';
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

test.describe.serial('Manage post permissions', () => {
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

    const post = await generateForumPost({
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: hiddenCategory.id,
      title: postName
    });

    // Login as user and not find the forum category

    // await login({
    //   page,
    //   userId: memberUser.id
    // });

    // // Start the navigation steps

    // await forumHomePage.goToForumHome(space.domain);

    // await forumHomePage.page.waitForTimeout(2000);

    // await forumHomePage.page.press('data-test=member-onboarding-form', 'Escape');

    // const postCard = forumHomePage.getPostCardLocator(post.id);

    // await expect(postCard).not.toBeVisible({
    //   timeout: 3000
    // });

    // await page.pause();
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

    await forumHomePage.page.waitForTimeout(2000);

    await forumHomePage.page.press('data-test=member-onboarding-form', 'Escape');

    const category = forumHomePage.getCategoryLocator(hiddenCategory.id);
    await category.hover();

    const categoryMenu = forumHomePage.getCategoryContextMenuLocator(hiddenCategory.id);
    await expect(categoryMenu).toBeVisible();

    await categoryMenu.click();

    const managePermissions = forumHomePage.getCategoryManagePermissionsLocator(hiddenCategory.id);
    await expect(managePermissions).toBeVisible();
    await managePermissions.click();

    await expect(forumHomePage.categoryPermissionsDialog).toBeVisible();

    let select = await page.getByRole('button', { name: 'No access' });
    await expect(select).toBeVisible();
    await select.click();

    const option = await page.getByRole('option', { name: 'View' });
    await expect(option).toBeVisible();
    await option.click();

    // The option should now be the select value
    select = await page.getByRole('button', { name: 'View' });
    await expect(select).toBeVisible();

    await forumHomePage.closeModalButton.click();

    await expect(forumHomePage.categoryPermissionsDialog).not.toBeVisible();
  });
});
