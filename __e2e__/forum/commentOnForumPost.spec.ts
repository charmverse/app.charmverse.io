import { expect, test as base } from '@playwright/test';
import type { Post, PostComment, Space, User } from '@prisma/client';

import { prisma } from 'db';
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

let memberUser: User;
let authorUser: User;
let space: Space;
let post: Post;
let memberComment: PostComment;
let authorComment: PostComment;

test.describe.serial('Comment on forum posts', () => {
  test('view forum post content - navigate to a forum post and view the content and comments', async ({
    page,
    forumHomePage,
    forumPostPage
  }) => {
    const generated = await createUserAndSpace({
      browserPage: page,
      permissionConfigurationMode: 'collaborative'
    });

    space = generated.space;

    memberUser = await createUser({
      browserPage: page,
      address: randomETHWalletAddress()
    });

    authorUser = await createUser({
      browserPage: page,
      address: randomETHWalletAddress()
    });

    await generateSpaceRole({
      spaceId: space.id,
      userId: memberUser.id,
      isAdmin: false
    });

    await generateSpaceRole({
      spaceId: space.id,
      userId: authorUser.id,
      isAdmin: false
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

    post = await generateForumPost({
      spaceId: space.id,
      userId: authorUser.id,
      categoryId: category.id,
      title: postName
    });

    const topLevelContentText = 'This is a great idea!';
    const childContentText = 'This is a great idea!';

    memberComment = await prisma.postComment.create({
      data: {
        user: {
          connect: { id: memberUser.id }
        },
        post: { connect: { id: post.id } },
        contentText: topLevelContentText,
        content: {
          type: 'doc',
          content: [
            {
              text: topLevelContentText,
              type: 'text'
            }
          ]
        }
      }
    });

    authorComment = await prisma.postComment.create({
      data: {
        user: {
          connect: { id: authorUser.id }
        },
        post: { connect: { id: post.id } },
        contentText: childContentText,
        content: {
          type: 'doc',
          content: [
            {
              text: childContentText,
              type: 'text'
            }
          ]
        }
      }
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

    const postTitle = forumPostPage.getPostPageTitleLocator();

    const titleInput = postTitle.getByText(post.title);

    await expect(titleInput).toBeVisible();

    // Check existing comments show. We can't target CharmEditor yet, so we just get all text contents of the HTML
    const topLevelCommentLocator = forumPostPage.getCommentLocator(memberComment.id);

    const commentBody1 = topLevelCommentLocator.getByText(topLevelContentText);
    await expect(commentBody1).toBeVisible();

    const childLevelCommentLocator = forumPostPage.getCommentLocator(authorComment.id);
    const commentBody2 = childLevelCommentLocator.getByText(childContentText);
    await expect(commentBody2).toBeVisible();

    // The button is usually disabled as the user hasn't typed anything yet
    await expect(forumPostPage.newTopLevelCommentInputLocator).toBeVisible();
    await expect(forumPostPage.newTopLevelCommentSubmitButtonLocator).toBeVisible();
  });

  test('author of a comment can edit their own post', async ({ forumPostPage, page }) => {
    await login({
      page,
      userId: memberUser.id
    });

    await forumPostPage.goToPostPage({
      domain: space.domain,
      path: post.path
    });

    await forumPostPage.waitForPostLoad({ domain: space.domain, path: post.path });
    const isCommentEditable = await forumPostPage.isCommentEditable(memberComment.id);

    expect(isCommentEditable).toBe(false);

    // Click on edit comment
    const commentContextMenu = forumPostPage.getPostCommentMenuLocator(memberComment.id);

    await expect(commentContextMenu).toBeVisible();

    await commentContextMenu.click();

    // Make sure user has access to both options
    const editOption = forumPostPage.getPostEditCommentLocator(memberComment.id);
    await expect(editOption).toBeVisible();
    const deleteOption = forumPostPage.getPostDeleteCommentLocator(memberComment.id);
    await expect(deleteOption).toBeVisible();

    await editOption.click();
    const isCommentEditableAfterClick = await forumPostPage.isCommentEditable(memberComment.id);

    expect(isCommentEditableAfterClick).toBe(true);

    const saveButton = forumPostPage.getPostSaveCommentButtonLocator(memberComment.id);

    await expect(saveButton).toBeVisible();

    const isButtonDisabled = await saveButton.getAttribute('disabled');
    await expect(isButtonDisabled).not.toBe('true');
  });

  test('another space user cannot edit a comment they did not write', async ({ forumPostPage, page }) => {
    await login({
      page,
      userId: memberUser.id
    });

    await forumPostPage.goToPostPage({
      domain: space.domain,
      path: post.path
    });

    await forumPostPage.waitForPostLoad({ domain: space.domain, path: post.path });
    const isCommentEditable = await forumPostPage.isCommentEditable(memberComment.id);

    expect(isCommentEditable).toBe(false);

    // Click on edit comment
    const commentContextMenu = forumPostPage.getPostCommentMenuLocator(authorComment.id);
    await expect(commentContextMenu).not.toBeVisible();
  });
});
