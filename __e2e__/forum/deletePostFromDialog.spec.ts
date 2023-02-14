import { expect, test as base } from '@playwright/test';
import type { PostCategory, Space, User } from '@prisma/client';
import { ForumHomePage } from '__e2e__/po/forumHome.po';
import { ForumPostPage } from '__e2e__/po/forumPost.po';
import { PageHeader } from '__e2e__/po/pageHeader';
import { createUser, createUserAndSpace, generateSpaceRole } from '__e2e__/utils/mocks';

import { prisma } from 'db';
import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
import { addSpaceOperations } from 'lib/permissions/spaces';
import { randomETHWalletAddress } from 'testing/generateStubs';
import { generateRole } from 'testing/setupDatabase';
import { generateForumPost, generatePostCategory } from 'testing/utils/forums';

import { login } from '../utils/session';

type Fixtures = {
  pageHeader: PageHeader;
  forumPostPage: ForumPostPage;
  forumHomePage: ForumHomePage;
};

const test = base.extend<Fixtures>({
  forumPostPage: ({ page }, use) => use(new ForumPostPage(page)),
  forumHomePage: ({ page }, use) => use(new ForumHomePage(page)),
  pageHeader: ({ page }, use) => use(new PageHeader(page))
});

let space: Space;
let authorUser: User;
let postCategory: PostCategory;

test.describe.serial('Delete forum posts from the post dialog', () => {
  test('admin can delete another user post from the post dialog', async ({ forumPostPage, forumHomePage, page }) => {
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
    // const postToDelete = await generateForumPost({
    //   spaceId: space.id,
    //   userId: authorUser.id,
    //   categoryId: postCategory.id,
    //   title: 'Post to delete'
    // });

    // // Start the real test ------------------
    // await login({ page, userId: adminUser.id });

    // await forumHomePage.goToForumHome(space.domain);

    // const postCard = forumHomePage.getPostCardLocator(postToDelete.id);

    // await expect(postCard).toBeVisible();

    // await postCard.click();

    // await expect(forumHomePage.postDialog).toBeVisible();
    // await expect(forumHomePage.postDialogContextMenu).toBeVisible();
    // await forumHomePage.postDialogContextMenu.click();
    // await expect(forumHomePage.postDialogDeleteButton).toBeVisible();
    // await forumHomePage.postDialogDeleteButton.click();

    // await expect(forumHomePage.postDialog).not.toBeVisible();
    // await page.pause();
    // await expect(postCard).not.toBeVisible();
  });
  // test('moderator can delete another user post from the post dialog', async ({
  //   forumPostPage,
  //   forumHomePage,
  //   page
  // }) => {
  //   const moderatorUser = await createUser({
  //     address: randomETHWalletAddress(),
  //     browserPage: page
  //   });

  //   // Provision space-wide moderator permissions
  //   await generateSpaceRole({
  //     spaceId: space.id,
  //     userId: moderatorUser.id,
  //     isAdmin: false
  //   });

  //   const moderatorRole = await generateRole({
  //     createdBy: moderatorUser.id,
  //     spaceId: space.id,
  //     roleName: 'moderator',
  //     assigneeUserIds: [moderatorUser.id]
  //   });

  //   await addSpaceOperations({
  //     forSpaceId: space.id,
  //     roleId: moderatorRole.id,
  //     operations: ['moderateForums']
  //   });

  //   // Allow the entire space to create posts and participate in this category
  //   const postToDelete = await generateForumPost({
  //     spaceId: space.id,
  //     userId: authorUser.id,
  //     categoryId: postCategory.id,
  //     title: 'Post to delete'
  //   });

  //   // Start the real test ------------------
  //   await login({ page, userId: moderatorUser.id });

  //   await forumHomePage.goToForumHome(space.domain);

  //   const postCard = forumHomePage.getPostCardLocator(postToDelete.id);

  //   await expect(postCard).toBeVisible();

  //   await postCard.click();

  //   await expect(forumHomePage.postDialog).toBeVisible();
  //   await expect(forumHomePage.postDialogContextMenu).toBeVisible();
  //   await forumHomePage.postDialogContextMenu.click();
  //   await expect(forumHomePage.postDialogDeleteButton).toBeVisible();
  //   await forumHomePage.postDialogDeleteButton.click();

  //   await expect(forumHomePage.postDialog).not.toBeVisible();
  //   await expect(postCard).not.toBeVisible();
  // });

  // test('author can delete their own post from the post dialog', async ({ forumPostPage, forumHomePage, page }) => {
  //   // Allow the entire space to create posts and participate in this category
  //   const postToDelete = await generateForumPost({
  //     spaceId: space.id,
  //     userId: authorUser.id,
  //     categoryId: postCategory.id,
  //     title: 'Post to delete'
  //   });

  //   // Start the real test ------------------
  //   await login({ page, userId: authorUser.id });

  //   await forumHomePage.goToForumHome(space.domain);

  //   const postCard = forumHomePage.getPostCardLocator(postToDelete.id);

  //   await expect(postCard).toBeVisible();

  //   await postCard.click();

  //   await expect(forumHomePage.postDialog).toBeVisible();
  //   await expect(forumHomePage.postDialogContextMenu).toBeVisible();
  //   await forumHomePage.postDialogContextMenu.click();
  //   await expect(forumHomePage.postDialogDeleteButton).toBeVisible();
  //   await forumHomePage.postDialogDeleteButton.click();

  //   await expect(forumHomePage.postDialog).not.toBeVisible();
  //   await expect(postCard).not.toBeVisible();
  // });

  test('space member without moderation permission cannot delete other user posts from the post dialog', async ({
    forumPostPage,
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

    await page.pause();

    forumHomePage.postDialogDeleteButton.click();

    // Only different assertion from others. Here, we want to make sure the delete option when clicked takes no action
    await page.waitForTimeout(1000);
    await expect(forumHomePage.postDialog).toBeVisible();

    // Close the context menu manually
    await forumHomePage.postDialogContextMenu.click();

    // Click first time to close the context menu, and second time to actually close the dialog
    await forumHomePage.postDialogCloseButton.click();
    await expect(postCard).toBeVisible();
  });
});
