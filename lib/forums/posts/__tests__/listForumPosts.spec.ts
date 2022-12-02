import type { Space, User } from '@prisma/client';

import { createPostCategory } from 'lib/forums/categories/createPostCategory';
import { generateForumPosts } from 'testing/forums';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import type { ForumPostPage } from '../interfaces';
import { defaultPostsPerResult, listForumPosts } from '../listForumPosts';

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
    const posts = await listForumPosts({ spaceId: space.id });

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

    const foundPosts = await listForumPosts({ spaceId: extraSpace.id, count: 10 });

    expect(foundPosts.data).toHaveLength(posts.length + categoryPosts.length);

    expect(foundPosts.data.some((p) => p.post.categoryId === null)).toBe(true);
    expect(foundPosts.data.some((p) => p.post.categoryId === category.id)).toBe(true);
  });

  it(`should support paginated queries and return 0 as the next page once there are no more results`, async () => {
    // With 40 posts, we should have 3 pages
    const resultsPerQuery = 19;

    const firstResult = await listForumPosts({ spaceId: space.id, count: resultsPerQuery });

    expect(firstResult.data).toHaveLength(resultsPerQuery);
    expect(firstResult.cursor).toBe(1);
    expect(firstResult.hasNext).toBe(true);

    const secondResult = await listForumPosts({ spaceId: space.id, count: resultsPerQuery, page: firstResult.cursor });
    expect(secondResult.data).toHaveLength(resultsPerQuery);
    expect(secondResult.cursor).toBe(2);
    expect(secondResult.hasNext).toBe(true);

    // What should be left for third query after executing the query twice
    const expectedRemainingData = spacePosts.length - resultsPerQuery * 2;

    const thirdResult = await listForumPosts({ spaceId: space.id, count: resultsPerQuery, page: secondResult.cursor });
    expect(thirdResult.data).toHaveLength(expectedRemainingData);
    expect(thirdResult.cursor).toBe(0);
    expect(thirdResult.hasNext).toBe(false);
  });

  it(`should support paginated queries for a combination of categories, or only uncategorised posts`, async () => {
    const { space: extraSpace, user: extraUser } = await generateUserAndSpaceWithApiToken();

    const category1 = await createPostCategory({ spaceId: space.id, name: 'Test Category 1' });
    const category2 = await createPostCategory({ spaceId: space.id, name: 'Test Category 2' });
    const category3 = await createPostCategory({ spaceId: space.id, name: 'Test Category 3' });

    const postsInCategory1 = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: 10,
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

    const uncategorisedPosts = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: 10
    });
    // With 40 posts, we should have 3 pages
    let resultsPerQuery = 10;

    // Test querying for posts in category 1 + 2 -------------------------------

    let firstResult = await listForumPosts({
      spaceId: extraSpace.id,
      count: resultsPerQuery,
      categoryIds: [category1.id, category2.id]
    });

    expect(firstResult.data).toHaveLength(resultsPerQuery);
    expect(firstResult.cursor).toBe(1);
    expect(firstResult.hasNext).toBe(true);

    let secondResult = await listForumPosts({
      spaceId: extraSpace.id,
      count: resultsPerQuery,
      page: firstResult.cursor,
      categoryIds: [category1.id, category2.id]
    });
    expect(secondResult.data).toHaveLength(resultsPerQuery);
    expect(secondResult.cursor).toBe(0);
    expect(secondResult.hasNext).toBe(false);

    // Test querying for posts in category 3 -------------------------------

    resultsPerQuery = 5;

    firstResult = await listForumPosts({
      spaceId: extraSpace.id,
      count: resultsPerQuery,
      categoryIds: [category3.id]
    });

    expect(firstResult.data).toHaveLength(resultsPerQuery);
    expect(firstResult.cursor).toBe(1);
    expect(firstResult.hasNext).toBe(true);

    secondResult = await listForumPosts({
      spaceId: extraSpace.id,
      count: resultsPerQuery,
      page: firstResult.cursor,
      categoryIds: [category3.id]
    });
    expect(secondResult.data).toHaveLength(resultsPerQuery);
    expect(secondResult.cursor).toBe(0);
    expect(secondResult.hasNext).toBe(false);

    // Test querying for uncategorised posts -------------------------------
    firstResult = await listForumPosts({
      spaceId: extraSpace.id,
      count: resultsPerQuery,
      categoryIds: null
    });

    expect(firstResult.data).toHaveLength(resultsPerQuery);
    expect(firstResult.cursor).toBe(1);
    expect(firstResult.hasNext).toBe(true);

    secondResult = await listForumPosts({
      spaceId: extraSpace.id,
      count: resultsPerQuery,
      page: firstResult.cursor,
      categoryIds: null
    });
    expect(secondResult.data).toHaveLength(resultsPerQuery);
    expect(secondResult.cursor).toBe(0);
    expect(secondResult.hasNext).toBe(false);

    // What should be left for third query after executing the query twice
  });
});
