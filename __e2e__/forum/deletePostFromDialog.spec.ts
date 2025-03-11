import type { PostCategory, Space, User } from '@charmverse/core/prisma';
import { randomETHWalletAddress } from '@packages/testing/generateStubs';
import { generateRole } from '@packages/testing/setupDatabase';
import { generateForumPost, generatePostCategory } from '@packages/testing/utils/forums';
import { expect, test as base } from '@playwright/test';
import { ForumHomePage } from '__e2e__/po/forumHome.po';
import { createUser, createUserAndSpace, generateSpaceRole } from '__e2e__/utils/mocks';

import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
import { addSpaceOperations } from 'lib/permissions/spaces';

import { login } from '../utils/session';

type Fixtures = {
  forumHomePage: ForumHomePage;
};

const test = base.extend<Fixtures>({
  forumHomePage: ({ page }, use) => use(new ForumHomePage(page))
});

let space: Space;
let authorUser: User;
let postCategory: PostCategory;

test.describe.serial('Delete forum posts from the post dialog, and autoclose dialog', () => {
  test('admin can delete another user post from the post dialog', async ({ forumHomePage, page }) => {
    // Setup test environment
    const generated = await createUserAndSpace({
      browserPage: page,
      permissionConfigurationMode: 'collaborative'
    });

    space = generated.space;

    const adminUser = generated.user;

    authorUser = await createUser({
      address: randomETHWalletAddress(),
      browserPage: page
    });

    await generateSpaceRole({
      spaceId: space.id,
      userId: authorUser.id,
      isAdmin: false
    });

    postCategory = await generatePostCategory({
      spaceId: space.id,
      name: 'Example category'
    });

    // Allow the entire space to create posts and participate in this category
    await upsertPostCategoryPermission({
      assignee: { group: 'space', id: space.id },
      permissionLevel: 'full_access',
      postCategoryId: postCategory.id
    });
    const postToDelete = await generateForumPost({
      spaceId: space.id,
      userId: authorUser.id,
      categoryId: postCategory.id,
      title: 'Post to delete'
    });

    // Start the real test ------------------
    await login({ page, userId: adminUser.id });

    await forumHomePage.goToForumHome(space.domain);

    const postCard = forumHomePage.getPostCardLocator(postToDelete.id);

    await expect(postCard).toBeVisible();

    await postCard.click();

    await expect(forumHomePage.postDialog).toBeVisible();
    await expect(forumHomePage.postDialogContextMenu).toBeVisible();
    await forumHomePage.postDialogContextMenu.click();
    await expect(forumHomePage.postDialogDeleteButton).toBeVisible();
    await forumHomePage.postDialogDeleteButton.click();

    await expect(forumHomePage.postDialog).not.toBeVisible();
    await expect(postCard).not.toBeVisible();
  });
  test('moderator can delete another user post from the post dialog', async ({ forumHomePage, page }) => {
    const moderatorUser = await createUser({
      address: randomETHWalletAddress(),
      browserPage: page
    });

    // Provision space-wide moderator permissions
    await generateSpaceRole({
      spaceId: space.id,
      userId: moderatorUser.id,
      isAdmin: false
    });

    const moderatorRole = await generateRole({
      createdBy: moderatorUser.id,
      spaceId: space.id,
      roleName: 'moderator',
      assigneeUserIds: [moderatorUser.id]
    });

    await addSpaceOperations({
      forSpaceId: space.id,
      roleId: moderatorRole.id,
      operations: ['moderateForums']
    });

    // Allow the entire space to create posts and participate in this category
    const postToDelete = await generateForumPost({
      spaceId: space.id,
      userId: authorUser.id,
      categoryId: postCategory.id,
      title: 'Post to delete'
    });

    // Start the real test ------------------
    await login({ page, userId: moderatorUser.id });

    await forumHomePage.goToForumHome(space.domain);

    const postCard = forumHomePage.getPostCardLocator(postToDelete.id);

    await expect(postCard).toBeVisible();

    await postCard.click();

    await expect(forumHomePage.postDialog).toBeVisible();
    await expect(forumHomePage.postDialogContextMenu).toBeVisible();
    await forumHomePage.postDialogContextMenu.click();
    await expect(forumHomePage.postDialogDeleteButton).toBeVisible();
    await forumHomePage.postDialogDeleteButton.click();

    await expect(forumHomePage.postDialog).not.toBeVisible();
    await expect(postCard).not.toBeVisible();
  });

  test('author can delete their own post from the post dialog', async ({ forumHomePage, page }) => {
    // Allow the entire space to create posts and participate in this category
    const postToDelete = await generateForumPost({
      spaceId: space.id,
      userId: authorUser.id,
      categoryId: postCategory.id,
      title: 'Post to delete'
    });

    // Start the real test ------------------
    await login({ page, userId: authorUser.id });

    await forumHomePage.goToForumHome(space.domain);

    const postCard = forumHomePage.getPostCardLocator(postToDelete.id);

    await expect(postCard).toBeVisible();

    await postCard.click();

    await expect(forumHomePage.postDialog).toBeVisible();
    await expect(forumHomePage.postDialogContextMenu).toBeVisible();
    await forumHomePage.postDialogContextMenu.click();
    await expect(forumHomePage.postDialogDeleteButton).toBeVisible();
    await forumHomePage.postDialogDeleteButton.click();

    await expect(forumHomePage.postDialog).not.toBeVisible();
    await expect(postCard).not.toBeVisible();
  });

  test('space member without moderation permission cannot delete other user posts from the post dialog', async ({
    forumHomePage,
    page
  }) => {
    // Allow the entire space to create posts and participate in this category
    const postToDelete = await generateForumPost({
      spaceId: space.id,
      userId: authorUser.id,
      categoryId: postCategory.id,
      title: 'Post to delete'
    });

    const spaceMember = await createUser({
      address: randomETHWalletAddress(),
      browserPage: page
    });

    await generateSpaceRole({
      spaceId: space.id,
      userId: spaceMember.id,
      isAdmin: false
    });

    // Start the real test ------------------
    await login({ page, userId: spaceMember.id });

    await forumHomePage.goToForumHome(space.domain);

    const postCard = forumHomePage.getPostCardLocator(postToDelete.id);

    await expect(postCard).toBeVisible();

    await postCard.click();

    await expect(forumHomePage.postDialog).toBeVisible();
    await expect(forumHomePage.postDialogContextMenu).toBeVisible();
    await forumHomePage.postDialogContextMenu.click();
    await expect(forumHomePage.postDialogDeleteButton).toBeVisible();

    const isDisabled = await forumHomePage.isDeletePostButtonDisabled();

    expect(isDisabled).toBe(true);
  });
});
