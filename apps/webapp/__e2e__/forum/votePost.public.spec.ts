import type { Post, PostCategory } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsForum, testUtilsUser } from '@charmverse/core/test';
import { expect } from '@playwright/test';

import { ForumHomePage } from '../po/forumHome.po';
import { test } from '../testWithFixtures';
import { generateSpaceRole, generateUser } from '../utils/mocks';
import { login } from '../utils/session';

let postCategory: PostCategory;
let post: Post;

test('upvote a post - public space', async ({ page, forumHomePage }) => {
  const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({
    isAdmin: true,
    spacePaidTier: 'free'
  });

  const spaceMember = await generateUser({});

  await generateSpaceRole({ spaceId: space.id, userId: spaceMember.id, isAdmin: false });

  postCategory = await testUtilsForum.generatePostCategory({
    spaceId: space.id,
    name: `Random postcategory name ${Math.random()}`
  });
  post = await testUtilsForum.generateForumPost({
    spaceId: space.id,
    userId: adminUser.id,
    categoryId: postCategory.id
  });

  await login({
    page,
    userId: spaceMember.id
  });

  // Finish setup, start the test
  await forumHomePage.goToForumHome(space.domain);

  const voteLocators = forumHomePage.getPostVoteLocators(post.id);

  await expect(voteLocators.upvote).toBeVisible();

  // Test state before vote
  const beforeVoteCount = (await voteLocators.score.allInnerTexts())[0];

  await expect(beforeVoteCount).toBe('0');

  // Test state after vote
  await voteLocators.upvote.click();

  await page.waitForResponse('**/api/forums/posts/*/vote');

  await page.waitForTimeout(500);

  const afterVoteCount = (await voteLocators.score.allInnerTexts())[0];

  await expect(afterVoteCount).toBe('1');

  // Make sure something happened in database

  const dbVotes = await prisma.postUpDownVote.count({
    where: {
      postId: post.id
    }
  });

  expect(dbVotes).toBe(1);
});
