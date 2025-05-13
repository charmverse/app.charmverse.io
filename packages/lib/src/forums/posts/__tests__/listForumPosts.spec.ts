import type { Post, Space, User } from '@charmverse/core/prisma';
import { generateForumPosts } from '@packages/testing/forums';
import { generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generatePostCategory } from '@packages/testing/utils/forums';

import { defaultPostsPerResult } from '../constants';
import { listForumPosts } from '../listForumPosts';
import { voteForumPost } from '../voteForumPost';

let space: Space;
let user: User;
let spacePosts: Post[];

// Test a space with 16 forum posts
beforeAll(async () => {
  const generated = await generateUserAndSpace();
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
  it(`should return posts from all categories if no category is provided`, async () => {
    const { space: extraSpace, user: extraUser } = await generateUserAndSpace();

    const category = await generatePostCategory({
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
    const { space: extraSpace, user: extraUser } = await generateUserAndSpace();

    const category1 = await generatePostCategory({ spaceId: space.id, name: 'Test Category 1' });
    const category2 = await generatePostCategory({ spaceId: space.id, name: 'Test Category 2' });
    const category3 = await generatePostCategory({ spaceId: space.id, name: 'Test Category 3' });

    const postsInCategory1 = await generateForumPosts({
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
    const { space: extraSpace, user: extraUser } = await generateUserAndSpace();
    const { user: secondExtraUser } = await generateUserAndSpace();

    const forumPosts = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: 20
    });

    const secondMostVotedPageId = forumPosts[5].id;
    const mostVotedPageId = forumPosts[2].id;

    await voteForumPost({
      postId: secondMostVotedPageId,
      userId: extraUser.id,
      upvoted: true
    });

    await voteForumPost({
      postId: mostVotedPageId,
      userId: extraUser.id,
      upvoted: true
    });

    await voteForumPost({
      postId: mostVotedPageId,
      userId: secondExtraUser.id,
      upvoted: true
    });

    const resultsPerQuery = 10;

    const postsOrderedByMostVoted = await listForumPosts(
      {
        spaceId: extraSpace.id,
        count: resultsPerQuery,
        sort: 'top'
      },
      user.id
    );

    // First two results should have upvotes and be ordered by number of votes
    expect(postsOrderedByMostVoted.data[0].id === mostVotedPageId).toBeTruthy();
    expect(postsOrderedByMostVoted.data[0].votes.upvotes).toBe(2);
    expect(postsOrderedByMostVoted.data[1].id === secondMostVotedPageId).toBeTruthy();
    expect(postsOrderedByMostVoted.data[1].votes.upvotes).toBe(1);
  });

  it('should support lookup of posts in multiple categories', async () => {
    const { space: extraSpace, user: extraUser } = await generateUserAndSpace();

    const category1 = await generatePostCategory({ spaceId: extraSpace.id, name: 'Test Category 1' });
    const category2 = await generatePostCategory({ spaceId: extraSpace.id, name: 'Test Category 2' });
    const category3 = await generatePostCategory({ spaceId: extraSpace.id, name: 'Test Category 3' });

    const postsInCategory1 = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: 5,
      categoryId: category1.id
    });

    const postsInCategory2 = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: 5,
      categoryId: category2.id
    });

    const postsInCategory3 = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: 5,
      categoryId: category3.id
    });

    const resultsPerQuery = 100;

    const postsInCategory1And2 = await listForumPosts(
      {
        spaceId: extraSpace.id,
        count: resultsPerQuery,
        categoryId: [category1.id, category2.id]
      },
      user.id
    );

    expect(postsInCategory1And2.data).toHaveLength([postsInCategory1, postsInCategory2].flat().length);
    expect(postsInCategory1And2.data.every((post) => !postsInCategory3.some((p) => p.id === post.id))).toBe(true);
  });

  it('should return empty results if categoryId is an empty array', async () => {
    const results = await listForumPosts(
      {
        spaceId: space.id,
        categoryId: []
      },
      user.id
    );

    expect(results.data).toHaveLength(0);
  });
});
