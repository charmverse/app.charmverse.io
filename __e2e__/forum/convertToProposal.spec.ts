import { test as base, expect } from '@playwright/test';
import { ForumPostPage } from '__e2e__/po/forumPost.po';
import { PageHeader } from '__e2e__/po/pageHeader';

import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
import { randomETHWalletAddress } from 'testing/generateStubs';
import { generateForumPost, generatePostCategory } from 'testing/utils/forums';

import { createUser, createUserAndSpace, generateSpaceRole } from '../utils/mocks';
import { login } from '../utils/session';

type Fixtures = {
  forumPostPage: ForumPostPage;
  pageHeader: PageHeader;
};

const test = base.extend<Fixtures>({
  forumPostPage: ({ page }, use) => use(new ForumPostPage(page)),
  pageHeader: ({ page }, use) => use(new PageHeader(page))
});

test('convert post to proposal - create a post, convert that post to proposal and assert editor is readonly with proposal banner', async ({
  page,
  forumPostPage,
  pageHeader
}) => {
  const { space, user } = await createUserAndSpace({
    browserPage: page,
    permissionConfigurationMode: 'collaborative'
  });

  await login({
    page,
    userId: user.id
  });

  const postName = 'Example post';
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

  const post = await generateForumPost({
    spaceId: space.id,
    userId: user.id,
    categoryId: category.id,
    title: postName
  });

  // Start the navigation steps
  await forumPostPage.goToPostPage({
    domain: space.domain,
    path: post.path
  });

  await forumPostPage.waitForPostLoad({
    domain: space.domain,
    path: post.path
  });

  await pageHeader.pageTopLevelMenu.click();

  const forumPostConvertProposalAction = page.locator('data-test=forum-post-convert-proposal-action');
  await forumPostConvertProposalAction.click();

  // Go back to post page to assert that we have the proposal conversion banner and editor is readonly
  await forumPostPage.goToPostPage({
    domain: space.domain,
    path: post.path
  });

  await forumPostPage.waitForPostLoad({
    domain: space.domain,
    path: post.path
  });

  const isEditable = await forumPostPage.isPostEditable();

  expect(isEditable).toBe(false);

  const postProposalBanner = await page.locator('data-test=post-proposal-banner');

  await expect(postProposalBanner).toBeVisible();
});

test('convert post to proposal - disabled convert proposal action for readOnly workspaces', async ({
  page,
  pageHeader,
  forumPostPage
}) => {
  const { space, user } = await createUserAndSpace({
    browserPage: page,
    permissionConfigurationMode: 'readOnly'
  });

  const postName = 'Example post';
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

  const post = await generateForumPost({
    spaceId: space.id,
    userId: user.id,
    categoryId: category.id,
    title: postName
  });

  const memberUser = await createUser({
    browserPage: page,
    address: randomETHWalletAddress()
  });

  await generateSpaceRole({
    spaceId: space.id,
    userId: memberUser.id,
    isAdmin: false
  });

  await login({
    page,
    userId: memberUser.id
  });

  await forumPostPage.goToPostPage({
    domain: space.domain,
    path: post.path
  });

  await forumPostPage.waitForPostLoad({
    domain: space.domain,
    path: post.path
  });

  await pageHeader.pageTopLevelMenu.click();

  const forumPostConvertProposalAction = page.locator('data-test=forum-post-convert-proposal-action');
  expect(forumPostConvertProposalAction.isDisabled()).toBeTruthy();
});
