import type { Post, PostCategory, Space, User } from '@charmverse/core/prisma';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import { generateForumPost, generatePostCategory } from '@packages/testing/utils/forums';
import { randomIntFromInterval } from '@packages/utils/random';
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
let postCategory: PostCategory;
let post: Post;

test.describe('Update category permissions', () => {
  test('category description - admin can set the category description', async ({ page, forumHomePage }) => {
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

    postCategory = await generatePostCategory({
      spaceId: space.id,
      name: categoryName
    });

    const postName = 'Post in category';

    post = await generateForumPost({
      spaceId: space.id,
      userId: adminUser.id,
      categoryId: postCategory.id,
      title: postName
    });
    await login({
      page,
      userId: adminUser.id
    });

    // Start the navigation steps

    await forumHomePage.goToForumHome(space.domain);

    // Go to the category
    await forumHomePage.getCategoryLocator(postCategory.id).click();
    await forumHomePage.waitForCategory({ domain: space.domain, path: postCategory.path as string });

    // No description should show
    await expect(forumHomePage.currentCategoryDescription).not.toBeVisible();

    // Open edit description dialog
    await forumHomePage.page.waitForTimeout(100); // give the view a chance to complete its update after navigation
    await forumHomePage.getCategoryContextMenuLocator(postCategory.id).click();
    await forumHomePage.getCategoryEditDescriptionLocator(postCategory.id).click();

    // Edit text in modal and save
    const newDescription = `Random text ${randomIntFromInterval(0, 100000000)}`;
    await forumHomePage.categoryDescriptionInput.fill(newDescription);
    await forumHomePage.saveCategoryDescription.click();

    // Ensure modal auto closed after save and new description shows
    await expect(forumHomePage.addCategoryInput).not.toBeVisible();

    await expect(forumHomePage.currentCategoryDescription).toBeVisible();

    const displayedText = await forumHomePage.currentCategoryDescription.innerText();

    expect(displayedText).toBe(newDescription);
  });
});
