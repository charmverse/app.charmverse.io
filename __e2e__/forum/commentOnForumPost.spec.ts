import { expect, test as base } from '@playwright/test';

import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
import { randomETHWalletAddress } from 'testing/generateStubs';
import { generateForumPost, generatePostCategory } from 'testing/utils/forums';

import { ForumHomePage } from '../po/forumHome.po';
import { ForumPostPage } from '../po/forumPost.po';
import { createUser, createUserAndSpace, generateSpaceRole } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  forumHomePage: ForumHomePage;
  forumPostPage: ForumPostPage;
};

const test = base.extend<Fixtures>({
  forumHomePage: ({ page }, use) => use(new ForumHomePage(page)),
  forumPostPage: ({ page }, use) => use(new ForumPostPage(page))
});

test('add forum category - navigate to forum and comment on a post', async ({ page, forumHomePage, forumPostPage }) => {
  const { space } = await createUserAndSpace({
    browserPage: page,
    permissionConfigurationMode: 'collaborative'
  });

  const memberUser = await createUser({
    browserPage: page,
    address: randomETHWalletAddress()
  });

  await generateSpaceRole({
    spaceId: space.id,
    userId: memberUser.id
  });

  const categoryName = 'Example category';

  const category = await generatePostCategory({
    spaceId: space.id,
    name: categoryName
  });

  await upsertPostCategoryPermission({
    assignee: { group: 'space', id: space.id },
    permissionLevel: 'full_access',
    postCategoryId: category.id
  });

  const postName = 'Example post';

  const post = await generateForumPost({
    spaceId: space.id,
    userId: memberUser.id,
    categoryId: category.id,
    title: postName
  });

  await login({
    page,
    userId: memberUser.id
  });

  // Start the navigation steps

  await forumHomePage.goToForumHome(space.domain);

  await forumHomePage.page.waitForTimeout(2000);

  await forumHomePage.page.press('data-test=member-onboarding-form', 'Escape');

  const postCard = forumHomePage.getPostCardLocator(post.id);

  await expect(postCard).toBeVisible();

  await postCard.click();

  const openAsPage = forumHomePage.getOpenPostAsPageLocator();

  await expect(openAsPage).toBeVisible();

  await openAsPage.click();

  await forumPostPage.waitForPostLoad({ domain: space.domain, path: post.path });

  const postTitle = forumPostPage.getPostPageTitleLocator(post.title);

  await expect(postTitle).toBeVisible();

  await page.pause();

  // Simplest way I could find to target the value of the input
  expect(await postTitle.allTextContents()).toContain(post.title);
});
