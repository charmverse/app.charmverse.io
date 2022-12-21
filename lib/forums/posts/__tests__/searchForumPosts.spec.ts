import type { Space, User } from '@prisma/client';

import { createPostCategory } from 'lib/forums/categories/createPostCategory';
import { generateForumPosts } from 'testing/forums';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

import type { ForumPostPageWithoutVotes } from '../interfaces';
import { defaultPostsPerResult, searchForumPosts } from '../searchForumPosts';

let space: Space;
let user: User;
let spacePosts: ForumPostPageWithoutVotes[];

const rootPostTitle = `Top level`;

// Test a space with 16 forum posts
beforeAll(async () => {
  const generated = await generateUserAndSpaceWithApiToken();
  space = generated.space;
  user = generated.user;

  spacePosts = await generateForumPosts({
    spaceId: space.id,
    createdBy: user.id,
    count: 40,
    title: rootPostTitle
  });
});

describe('searchForumPosts', () => {
  it(`should return posts with a matching title (case-insensitive)`, async () => {
    const { space: extraSpace, user: extraUser } = await generateUserAndSpaceWithApiToken();

    const title = `SearchPost`;

    const matchingForumPosts = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: 3,
      title
    });

    const notMatchingForumPosts = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: 3,
      title: `Different`
    });
    const result = await searchForumPosts(
      {
        spaceId: extraSpace.id,
        search: title
      },
      user.id
    );

    expect(result.data.length).toEqual(3);
    expect(result.hasNext).toBe(false);
    expect(result.cursor).toBe(0);
  });

  it(`should return posts with a matching content text (case-insensitive)`, async () => {
    const { space: extraSpace, user: extraUser } = await generateUserAndSpaceWithApiToken();

    const contentText = `ContentText to provide`;

    const matchingForumPosts = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: 3,
      contentText
    });

    const notMatchingForumPosts = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: 3,
      contentText: `Ignore this`
    });
    const result = await searchForumPosts(
      {
        spaceId: extraSpace.id,
        search: contentText.substring(0, 5)
      },
      user.id
    );

    expect(result.data.length).toEqual(3);
    expect(result.hasNext).toBe(false);
    expect(result.cursor).toBe(0);
  });

  it(`should return ${defaultPostsPerResult} posts by default`, async () => {
    const posts = await searchForumPosts({ spaceId: space.id, search: rootPostTitle.substring(0, 5) }, user.id);
    expect(posts.data).toHaveLength(defaultPostsPerResult);
  });

  it(`should return only return published posts`, async () => {
    const { space: _space, user: _user } = await generateUserAndSpaceWithApiToken();
    const title = 'title';
    const draftPost = await generateForumPosts({
      createdBy: _user.id,
      spaceId: _space.id,
      status: 'draft',
      count: 1,
      title
    });

    const publishedPost = await generateForumPosts({
      createdBy: _user.id,
      spaceId: _space.id,
      status: 'published',
      count: 1,
      title
    });
    const posts = await searchForumPosts({ spaceId: _space.id, search: title }, _user.id);
    expect(posts.data).toHaveLength(1);
    expect(posts.data[0].post.status).toEqual('published');
  });

  it(`should return posts from all categories if no category id is provided`, async () => {
    const { space: extraSpace, user: extraUser } = await generateUserAndSpaceWithApiToken();

    const exampleTitle = `Example title`;

    const category = await createPostCategory({
      spaceId: extraSpace.id,
      name: 'Test Category'
    });

    const uncategorisedPostsToGenerate = 2;
    const categorisedPostsToGenerate = 2;

    const posts = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: uncategorisedPostsToGenerate,
      title: exampleTitle
    });

    const categoryPosts = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: categorisedPostsToGenerate,
      categoryId: category.id,
      title: exampleTitle
    });

    const ignoredPosts = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: 2,
      categoryId: category.id,
      title: `Post we should not see`
    });

    const foundPosts = await searchForumPosts(
      { spaceId: extraSpace.id, count: 10, search: exampleTitle.substring(0, 5) },
      user.id
    );

    expect(foundPosts.data).toHaveLength(uncategorisedPostsToGenerate + categorisedPostsToGenerate);

    // Make sure ignored posts didn't enter the result
    expect(foundPosts.data.every((item) => ignoredPosts.every((_post) => _post.id !== item.id)));
  });

  it(`should support paginated queries and return 0 as the next page once there are no more results`, async () => {
    const title = `Pagination test`;

    const matchingPosts = await generateForumPosts({
      count: 40,
      spaceId: space.id,
      createdBy: user.id,
      title
    });

    // With 40 posts, we should have 3 pages
    const resultsPerQuery = 19;

    const firstResult = await searchForumPosts(
      { spaceId: space.id, count: resultsPerQuery, search: title.substring(0, 5) },
      user.id
    );

    expect(firstResult.data).toHaveLength(resultsPerQuery);
    expect(firstResult.cursor).toBe(1);
    expect(firstResult.hasNext).toBe(true);

    const secondResult = await searchForumPosts(
      { spaceId: space.id, count: resultsPerQuery, page: firstResult.cursor, search: title.substring(0, 5) },
      user.id
    );
    expect(secondResult.data).toHaveLength(resultsPerQuery);
    expect(secondResult.cursor).toBe(2);
    expect(secondResult.hasNext).toBe(true);

    // What should be left for third query after executing the query twice
    const expectedRemainingData = spacePosts.length - resultsPerQuery * 2;

    const thirdResult = await searchForumPosts(
      { spaceId: space.id, count: resultsPerQuery, page: secondResult.cursor, search: title.substring(0, 5) },
      user.id
    );
    expect(thirdResult.data).toHaveLength(expectedRemainingData);
    expect(thirdResult.cursor).toBe(0);
    expect(thirdResult.hasNext).toBe(false);
  });

  it('should return only posts from a specific category if provided, or uncategorised posts if category ID is null', async () => {
    const { space: extraSpace, user: extraUser } = await generateUserAndSpaceWithApiToken();

    const exampleTitle = `Example title`;

    const category = await createPostCategory({
      spaceId: extraSpace.id,
      name: 'Test Category'
    });

    const uncategorisedPostsToGenerate = 4;
    const categorisedPostsToGenerate = 2;

    const uncategorisedPosts = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: uncategorisedPostsToGenerate,
      title: exampleTitle
    });

    const categoryPosts = await generateForumPosts({
      spaceId: extraSpace.id,
      createdBy: extraUser.id,
      count: categorisedPostsToGenerate,
      categoryId: category.id,
      title: exampleTitle
    });

    // First assertion - categorised
    const foundCategoryPosts = await searchForumPosts(
      { spaceId: extraSpace.id, count: 10, categoryId: category.id, search: exampleTitle.substring(0, 5) },
      user.id
    );

    expect(foundCategoryPosts.data).toHaveLength(categorisedPostsToGenerate);

    // Make sure ignored posts didn't enter the result
    expect(foundCategoryPosts.data.every((item) => categoryPosts.some((_post) => _post.id === item.id)));

    // Second assertion - uncategorised
    const foundUncategorisedPosts = await searchForumPosts(
      { spaceId: extraSpace.id, count: 10, categoryId: null, search: exampleTitle.substring(0, 5) },
      user.id
    );

    expect(foundUncategorisedPosts.data).toHaveLength(uncategorisedPostsToGenerate);

    // Make sure ignored posts didn't enter the result
    expect(foundUncategorisedPosts.data.every((item) => uncategorisedPosts.some((_post) => _post.id === item.id)));
  });
});
