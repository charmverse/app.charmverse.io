import { expect, test as base } from '@playwright/test';

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

test('view forum post content - navigate to a forum post and view the content and comments', async ({
  page,
  forumHomePage,
  forumPostPage
}) => {
  const { space } = await createUserAndSpace({
    browserPage: page,
    permissionConfigurationMode: 'collaborative'
  });

  const memberUser = await createUser({
    browserPage: page,
    address: randomETHWalletAddress()
  });

  const authorUser = await createUser({
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

  const post = await generateForumPost({
    spaceId: space.id,
    userId: memberUser.id,
    categoryId: category.id,
    title: postName
  });

  const topLevelContentText = 'This is a great idea!';
  const childContentText = 'This is a great idea!';

  const topLevelComment = await prisma.postComment.create({
    data: {
      user: {
        connect: { id: authorUser.id }
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

  const childComment = await prisma.postComment.create({
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

  await expect(postTitle).toBeVisible();

  // Simplest way I could find to target the value of the input
  // Makes sure user can see the post title
  expect(await postTitle.allTextContents()).toContain(post.title);

  // Check existing comments show. We can't target CharmEditor yet, so we just get all text contents of the HTML
  const topLevelCommentLocator = forumPostPage.getCommentLocator(topLevelComment.id);
  expect((await topLevelCommentLocator.allTextContents())[0]).toMatch(topLevelContentText);

  const childLevelCommentLocator = forumPostPage.getCommentLocator(childComment.id);
  expect((await childLevelCommentLocator.allTextContents())[0]).toMatch(childContentText);

  // The button is usually disabled as the user hasn't typed anything yet
  await expect(forumPostPage.newTopLevelCommentInputLocator).toBeVisible();
  await expect(forumPostPage.newTopLevelCommentSubmitButtonLocator).toBeVisible();
});
