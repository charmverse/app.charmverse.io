import type { Post, PostCategory, PostComment, Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { generateForumPost, generatePostCategory } from '@packages/testing/utils/forums';
import { expect, test as base } from '@playwright/test';
import { ForumPostPage } from '__e2e__/po/forumPost.po';

import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';

import { ForumHomePage } from '../po/forumHome.po';
import { createUserAndSpace } from '../utils/mocks';
import { logout } from '../utils/session';

type Fixtures = {
  forumHomePage: ForumHomePage;
  forumPostPage: ForumPostPage;
};

const test = base.extend<Fixtures>({
  forumHomePage: ({ page }, use) => use(new ForumHomePage(page)),
  forumPostPage: ({ page }, use) => use(new ForumPostPage(page))
});

let space: Space;
let publicCategory: PostCategory;
let secondPublicCategory: PostCategory;
let hiddenCategory: PostCategory;
let publicPost: Post;
let publicPostComment: PostComment;
let secondPublicPost: Post;
let hiddenPost: Post;

const forumPostContentText = 'This is a post';
const forumPostCommentText = 'This is a comment on a public post';
test.describe.serial('Access public forum', () => {
  test('public user can only view public categories, and navigate between public categories', async ({
    page,
    forumHomePage
  }) => {
    // Initial setup
    const generated = await createUserAndSpace({
      browserPage: page,
      permissionConfigurationMode: 'collaborative'
    });

    space = generated.space;

    publicCategory = await generatePostCategory({
      spaceId: space.id,
      name: 'Public category'
    });

    await upsertPostCategoryPermission({
      assignee: { group: 'public' },
      permissionLevel: 'view',
      postCategoryId: publicCategory.id
    });

    publicPost = await generateForumPost({
      spaceId: space.id,
      userId: generated.user.id,
      categoryId: publicCategory.id,
      title: 'Public post',
      contentText: forumPostContentText,
      content: {
        type: 'doc',
        content: [
          {
            type: 'paragraph',
            content: [
              {
                type: 'text',
                text: forumPostContentText
              }
            ]
          }
        ]
      }
    });

    publicPostComment = await prisma.postComment.create({
      data: {
        contentText: forumPostCommentText,
        post: { connect: { id: publicPost.id } },
        user: { connect: { id: generated.user.id } },
        content: {
          type: 'doc',
          content: [
            {
              type: 'paragraph',
              content: [
                {
                  type: 'text',
                  text: forumPostCommentText
                }
              ]
            }
          ]
        }
      }
    });

    secondPublicCategory = await generatePostCategory({
      spaceId: space.id,
      name: 'Second public category'
    });

    await upsertPostCategoryPermission({
      assignee: { group: 'public' },
      permissionLevel: 'view',
      postCategoryId: secondPublicCategory.id
    });

    secondPublicPost = await generateForumPost({
      spaceId: space.id,
      userId: generated.user.id,
      categoryId: secondPublicCategory.id,
      title: 'Public post'
    });

    hiddenCategory = await generatePostCategory({
      spaceId: space.id,
      name: 'Hidden category'
    });

    hiddenPost = await generateForumPost({
      spaceId: space.id,
      userId: generated.user.id,
      categoryId: hiddenCategory.id,
      title: 'Hidden post'
    });

    await logout({ page });

    // Start the navigation steps

    await forumHomePage.goToForumHome(space.domain);
    // Go as public member and not find the forum category or the post

    const publicCategoryLocator = forumHomePage.getCategoryLocator(publicCategory.id);
    const publicPostLocator = forumHomePage.getPostCardLocator(publicPost.id);

    const secondPublicCategoryLocator = forumHomePage.getCategoryLocator(secondPublicCategory.id);
    const secondPublicPostLocator = forumHomePage.getPostCardLocator(secondPublicPost.id);

    // Show all public content in forum home
    await expect(publicCategoryLocator).toBeVisible();
    await expect(publicPostLocator).toBeVisible();
    await expect(secondPublicCategoryLocator).toBeVisible();
    await expect(secondPublicPostLocator).toBeVisible();

    await expect(forumHomePage.getCategoryLocator(hiddenCategory.id)).not.toBeVisible();
    await expect(forumHomePage.getPostCardLocator(hiddenPost.id)).not.toBeVisible();

    await publicCategoryLocator.click();

    await forumHomePage.waitForCategory({ domain: space.domain, path: publicCategory.path as string });

    // Only show content from current selected public category
    await expect(publicCategoryLocator).toBeVisible();
    await expect(publicPostLocator).toBeVisible();
    await expect(secondPublicPostLocator).not.toBeVisible();
  });

  test('public user can open a public post from the forum home and see its content', async ({
    forumHomePage,
    forumPostPage,
    page
  }) => {
    // Start the navigation steps

    await forumHomePage.goToForumHome(space.domain);
    // Open a post in the post dialog
    await forumHomePage.getPostCardLocator(publicPost.id).click();

    // Check user can see the title
    const postTitleLocator = forumPostPage.getPostPageTitleLocator();

    await expect(postTitleLocator).toBeVisible();
    const postTitleText = (await postTitleLocator.allInnerTexts())[0];
    expect(postTitleText).toMatch(publicPost.title);

    // Check user can see the content and it is in readonly mode
    const post = forumPostPage.postCharmeditor;

    await expect(post).toBeVisible();

    const postText = (await post.allInnerTexts())[0];
    expect(postText).toMatch(forumPostContentText);

    const isEditable = await forumPostPage.isPostEditable();
    expect(isEditable).toBe(false);

    // Check user can see the comment
    const comment = forumPostPage.getCommentLocator(publicPostComment.id);

    await expect(comment).toBeVisible();

    const commentText = (await comment.allInnerTexts())[0];
    expect(commentText).toMatch(forumPostCommentText);

    // Click to the page and make sure we get redirected there
    await forumHomePage.getOpenPostAsPageLocator().click();
    await forumPostPage.waitForPostLoad({
      domain: space.domain,
      path: publicPost.path as string
    });
  });

  // Covers the case where permissions or state might not load correctly if user goes straight to post page
  test('public user can navigate directly to a public post and see its content', async ({ forumPostPage }) => {
    await forumPostPage.goToPostPage({ domain: space.domain, path: publicPost.path as string });

    // Check user can see the title
    const postTitleLocator = forumPostPage.getPostPageTitleLocator();

    await expect(postTitleLocator).toBeVisible();
    const postTitleText = (await postTitleLocator.allInnerTexts())[0];
    expect(postTitleText).toMatch(publicPost.title);

    // Check user can see the content and it is in readonly mode
    const post = forumPostPage.postCharmeditor;

    await expect(post).toBeVisible();

    const postText = (await post.allInnerTexts())[0];
    expect(postText).toMatch(forumPostContentText);

    const isEditable = await forumPostPage.isPostEditable();
    expect(isEditable).toBe(false);

    // Check user can see the comment
    const comment = forumPostPage.getCommentLocator(publicPostComment.id);
    const commentText = (await comment.allInnerTexts())[0];
    expect(commentText).toMatch(forumPostCommentText);
  });
});
