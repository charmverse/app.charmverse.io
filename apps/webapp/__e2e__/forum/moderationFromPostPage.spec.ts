import { prisma } from '@charmverse/core/prisma-client';
import { generatePostCategory, generateForumPost } from '@packages/testing/utils/forums';
import { expect } from '@playwright/test';
import { ForumHomePage } from '__e2e__/po/forumHome.po';
import { ForumPostPage } from '__e2e__/po/forumPost.po';
import { PageHeader } from '__e2e__/po/pageHeader.po';
import { generateUserAndSpace, generateUser, grantForumModeratorAccess } from '__e2e__/utils/mocks';

import { test } from '../testWithFixtures';
import { login } from '../utils/session';

test.describe('Moderate forum posts', () => {
  test('moderator can delete an unwanted comment', async ({ forumPostPage, page }) => {
    // Setup test environment
    const { space, user: memberUser } = await generateUserAndSpace();

    const authorUser = await generateUser({
      space: { id: space.id }
    });

    const moderatorUser = await generateUser({
      space: { id: space.id }
    });

    const categoryName = 'Example category';

    const postCategory = await generatePostCategory({
      spaceId: space.id,
      name: categoryName,
      fullAccess: true
    });

    await grantForumModeratorAccess({ categoryId: postCategory.id, spaceId: space.id, userId: moderatorUser.id });

    const postName = 'Example post';

    const post = await generateForumPost({
      spaceId: space.id,
      userId: authorUser.id,
      categoryId: postCategory.id,
      title: postName
    });

    const commenttext = 'This is a great idea!';

    const unwantedcomment = await prisma.postComment.create({
      data: {
        user: {
          connect: { id: memberUser.id }
        },
        post: { connect: { id: post.id } },
        contentText: commenttext,
        content: {
          type: 'doc',
          content: [
            {
              text: commenttext,
              type: 'text'
            }
          ]
        }
      }
    });

    // Start the real test ------------------
    await login({ page, userId: moderatorUser.id });

    await forumPostPage.goToPostPage({
      domain: space.domain,
      path: post.path
    });

    await forumPostPage.waitForPostLoad({
      domain: space.domain,
      path: post.path
    });
    const contextMenu = forumPostPage.getPostCommentMenuLocator(unwantedcomment.id);

    await expect(contextMenu).toBeVisible();

    await contextMenu.click();

    const deleteOption = forumPostPage.getPostDeleteCommentLocator(unwantedcomment.id);

    await expect(deleteOption).toBeVisible();

    await deleteOption.click();

    const deletedComment = forumPostPage.getDeletedCommentLocator(unwantedcomment.id);

    await expect(deletedComment).toBeVisible();
  });
  test('moderator can delete an unwanted post from the full view post page', async ({
    forumPostPage,
    forumHomePage,
    page,
    pageHeader
  }) => {
    const { space } = await generateUserAndSpace();

    const authorUser = await generateUser({
      space: { id: space.id }
    });

    const moderatorUser = await generateUser({
      space: { id: space.id }
    });
    const postCategory = await generatePostCategory({
      spaceId: space.id,
      fullAccess: true
    });
    await grantForumModeratorAccess({ categoryId: postCategory.id, spaceId: space.id, userId: moderatorUser.id });

    const postToDelete = await generateForumPost({
      spaceId: space.id,
      userId: authorUser.id,
      categoryId: postCategory.id
    });
    await login({ page, userId: moderatorUser.id });
    await forumPostPage.goToPostPage({
      domain: space.domain,
      path: postToDelete.path
    });
    const header = pageHeader.pageTopLevelMenu;
    await expect(header).toBeVisible();
    await header.click();
    const forumPostActions = pageHeader.forumPostActions;
    await expect(forumPostActions).toBeVisible();
    const deleteOption = pageHeader.deleteCurrentPage;
    await expect(deleteOption).toBeVisible();
    await deleteOption.click();
    // After deleting, user should be redirected to the forum home page
    await forumHomePage.waitForForumHome(space.domain);
  });

  test('author can delete their own post from the full view post page', async ({
    forumPostPage,
    forumHomePage,
    page,
    pageHeader
  }) => {
    const { space, user: authorUser } = await generateUserAndSpace();

    const postCategory = await generatePostCategory({
      spaceId: space.id,
      fullAccess: true
    });
    const postToDelete = await generateForumPost({
      spaceId: space.id,
      userId: authorUser.id,
      categoryId: postCategory.id
    });
    await login({ page, userId: authorUser.id });
    await forumPostPage.goToPostPage({
      domain: space.domain,
      path: postToDelete.path
    });
    const header = pageHeader.pageTopLevelMenu;
    await expect(header).toBeVisible();
    await header.click();
    const forumPostActions = pageHeader.forumPostActions;
    await expect(forumPostActions).toBeVisible();
    const deleteOption = pageHeader.deleteCurrentPage;
    await expect(deleteOption).toBeVisible();
    await deleteOption.click();
    // After deleting, user should be redirected to the forum home page
    await forumHomePage.waitForForumHome(space.domain);
  });

  test('normal member sees a disabled delete post button', async ({ forumPostPage, page, pageHeader }) => {
    const { space, user: memberUser } = await generateUserAndSpace();
    const authorUser = await generateUser({
      space: { id: space.id }
    });
    const postCategory = await generatePostCategory({
      spaceId: space.id,
      fullAccess: true
    });
    const postToDelete = await generateForumPost({
      spaceId: space.id,
      userId: authorUser.id,
      categoryId: postCategory.id
    });

    await login({ page, userId: memberUser.id });

    await forumPostPage.goToPostPage({
      domain: space.domain,
      path: postToDelete.path
    });

    const header = pageHeader.pageTopLevelMenu;

    await expect(header).toBeVisible();

    await header.click();

    const forumPostActions = pageHeader.forumPostActions;
    await expect(forumPostActions).toBeVisible();

    const deleteOption = pageHeader.deleteCurrentPage;
    await expect(deleteOption).toBeVisible();

    // The mui lib renders this element as a div with a disabled css class, but no prop. We can check for the aria-disabled attribute instead as a workaround
    const isDisabled = await deleteOption.getAttribute('aria-disabled');

    expect(isDisabled).toBe('true');
  });
});
