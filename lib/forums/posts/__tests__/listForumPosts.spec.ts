import type { Space, User } from '@prisma/client';

import { createPostCategory } from 'lib/forums/categories/createPostCategory';
import { generateForumPosts } from 'testing/forums';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import type { ForumPostPage } from '../interfaces';
import { defaultPostsPerResult, listForumPosts } from '../listForumPosts';
import { voteForumPost } from '../voteForumPost';

let space: Space;
let user: User;
let spacePosts: ForumPostPage[];

// Test a space with 16 forum posts
beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;

  spacePosts = await generateForumPosts({
    spaceId: space.id,
    createdBy: user.id,
    count: 40
  });
});

describe('listForumPosts', () => {
  it(`should return ${defaultPostsPerResult} posts by default`, async () => {
    const posts = await listForumPosts({ spaceId: space.id }, user.id);

    expect(posts.data).toHaveLength(defaultPostsPerResult);
  });
  it(`should return posts from all cateogories (including uncategorised) if no category is provided`, async () => {
    const { space: extraSpace, user: extraUser } = await generateUserAndSpaceWithApiToken();

    const category = await createPostCategory({
      spaceId: extraSpace.id,
      name: 'Test Category'
    });

    const posts = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: 2
    });

    const categoryPosts = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: 2,
      categoryId: category.id
    });

    const foundPosts = await listForumPosts({ spaceId: extraSpace.id, count: 10 }, user.id);

    expect(foundPosts.data).toHaveLength(posts.length + categoryPosts.length);

    expect(foundPosts.data.some((p) => p.categoryId === category.id)).toBe(true);
  });

  it(`should support paginated queries and return 0 as the next page once there are no more results`, async () => {
    // With 40 posts, we should have 3 pages
    const resultsPerQuery = 19;

    const firstResult = await listForumPosts({ spaceId: space.id, count: resultsPerQuery }, user.id);

    expect(firstResult.data).toHaveLength(resultsPerQuery);
    expect(firstResult.cursor).toBe(1);
    expect(firstResult.hasNext).toBe(true);

    const secondResult = await listForumPosts(
      { spaceId: space.id, count: resultsPerQuery, page: firstResult.cursor },
      user.id
    );
    expect(secondResult.data).toHaveLength(resultsPerQuery);
    expect(secondResult.cursor).toBe(2);
    expect(secondResult.hasNext).toBe(true);

    // What should be left for third query after executing the query twice
    const expectedRemainingData = spacePosts.length - resultsPerQuery * 2;

    const thirdResult = await listForumPosts(
      { spaceId: space.id, count: resultsPerQuery, page: secondResult.cursor },
      user.id
    );
    expect(thirdResult.data).toHaveLength(expectedRemainingData);
    expect(thirdResult.cursor).toBe(0);
    expect(thirdResult.hasNext).toBe(false);
  });

  it(`should support paginated queries for a combination of categories, or only uncategorised posts`, async () => {
    const { space: extraSpace, user: extraUser } = await generateUserAndSpaceWithApiToken();

    const category1 = await createPostCategory({ spaceId: space.id, name: 'Test Category 1' });
    const category2 = await createPostCategory({ spaceId: space.id, name: 'Test Category 2' });
    const category3 = await createPostCategory({ spaceId: space.id, name: 'Test Category 3' });

    const forumPosts = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: 20,
      categoryId: category1.id
    });

    const postsInCategory2 = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: 10,
      categoryId: category2.id
    });

    const postsInCategory3 = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: 10,
      categoryId: category3.id
    });
    // With 40 posts, we should have 3 pages
    let resultsPerQuery = 10;
    // Test querying for posts in category 3 -------------------------------

    resultsPerQuery = 5;

    let firstResult = await listForumPosts(
      {
        spaceId: extraSpace.id,
        count: resultsPerQuery,
        categoryId: category3.id
      },
      user.id
    );

    expect(firstResult.data).toHaveLength(resultsPerQuery);
    expect(firstResult.cursor).toBe(1);
    expect(firstResult.hasNext).toBe(true);

    let secondResult = await listForumPosts(
      {
        spaceId: extraSpace.id,
        count: resultsPerQuery,
        page: firstResult.cursor,
        categoryId: category3.id
      },
      user.id
    );
    expect(secondResult.data).toHaveLength(resultsPerQuery);
    expect(secondResult.cursor).toBe(0);
    expect(secondResult.hasNext).toBe(false);

    // Test querying for uncategorised posts -------------------------------
    firstResult = await listForumPosts(
      {
        spaceId: extraSpace.id,
        count: resultsPerQuery
      },
      user.id
    );

    expect(firstResult.data).toHaveLength(resultsPerQuery);
    expect(firstResult.cursor).toBe(1);
    expect(firstResult.hasNext).toBe(true);

    secondResult = await listForumPosts(
      {
        spaceId: extraSpace.id,
        count: resultsPerQuery,
        page: firstResult.cursor
      },
      user.id
    );
    expect(secondResult.data).toHaveLength(resultsPerQuery);
    expect(secondResult.cursor).toBe(2);
    expect(secondResult.hasNext).toBe(true);

    // What should be left for third query after executing the query twice
  });

  it(`should support sorting`, async () => {
    const { space: extraSpace, user: extraUser } = await generateUserAndSpaceWithApiToken();
    const { user: secondExtraUser } = await generateUserAndSpaceWithApiToken();

    const forumPosts = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: 20
    });

    const secondMostVotedPageId = forumPosts[5].id;
    const mostVotedPageId = forumPosts[2].id;

    await voteForumPost({
      pageId: secondMostVotedPageId,
      userId: extraUser.id,
      upvoted: true
    });

    await voteForumPost({
      pageId: mostVotedPageId,
      userId: extraUser.id,
      upvoted: true
    });

    await voteForumPost({
      pageId: mostVotedPageId,
      userId: secondExtraUser.id,
      upvoted: true
    });

    const resultsPerQuery = 10;

    const postsOrderedByMostVoted = await listForumPosts(
      {
        spaceId: extraSpace.id,
        count: resultsPerQuery,
        sort: 'most_voted'
      },
      user.id
    );

    // First two results should have upvotes and be ordered by number of votes
    expect(postsOrderedByMostVoted.data[0].id === mostVotedPageId).toBeTruthy();
    expect(postsOrderedByMostVoted.data[0].votes.upvotes).toBe(2);
    expect(postsOrderedByMostVoted.data[1].id === secondMostVotedPageId).toBeTruthy();
    expect(postsOrderedByMostVoted.data[1].votes.upvotes).toBe(1);
  });
});
