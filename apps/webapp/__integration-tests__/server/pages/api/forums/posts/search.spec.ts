/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Post, PostCategory, Space, User } from '@charmverse/core/prisma';
import type { ForumPostMeta } from '@packages/lib/forums/posts/getPostMeta';
import type { ListForumPostsRequest, PaginatedPostList } from '@packages/lib/forums/posts/listForumPosts';
import type { SearchForumPostsRequest } from '@packages/lib/forums/posts/searchForumPosts';
import { upsertPostCategoryPermission } from '@packages/lib/permissions/forum/upsertPostCategoryPermission';
import { generateForumPosts } from '@packages/testing/forums';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import {
  generateSpaceUser,
  generateUserAndSpace,
  generateUserAndSpaceWithApiToken
} from '@packages/testing/setupDatabase';
import { generateForumPost, generatePostCategory } from '@packages/testing/utils/forums';
import request from 'supertest';

let firstSpace: Space;
let firstSpaceUser: User;
let firstSpaceAdminUser: User;
let firstSpacePostCategory: PostCategory;
const title = `Post title`;
const visiblePosts = 4;
let firstSpacePostCategoryPosts: Post[];
let firstSpaceAdminOnlyPostCategory: PostCategory;
const hiddenPosts = 2;
let firstSpaceAdminOnlyPostCategoryPosts: Post[];
// Second space
let secondSpace: Space;
let secondSpaceUser: User;

beforeAll(async () => {
  const { space: _firstSpace, user: _firstAdminUser } = await generateUserAndSpace({ isAdmin: true });

  firstSpace = _firstSpace;
  firstSpaceAdminUser = _firstAdminUser;
  firstSpaceUser = await generateSpaceUser({ isAdmin: false, spaceId: firstSpace.id });

  const { space: _secondSpace, user: _secondUser } = await generateUserAndSpaceWithApiToken(undefined, false);

  secondSpace = _secondSpace;
  secondSpaceUser = _secondUser;

  firstSpacePostCategory = await generatePostCategory({
    name: 'Test Category',
    spaceId: firstSpace.id
  });

  await upsertPostCategoryPermission({
    postCategoryId: firstSpacePostCategory.id,
    permissionLevel: 'full_access',
    assignee: { group: 'space', id: firstSpace.id }
  });

  firstSpaceAdminOnlyPostCategory = await generatePostCategory({
    spaceId: firstSpace.id,
    name: 'Admin category'
  });

  firstSpacePostCategoryPosts = await generateForumPosts({
    count: visiblePosts,
    categoryId: firstSpacePostCategory.id,
    title,
    createdBy: firstSpaceAdminUser.id,
    spaceId: firstSpace.id
  });

  firstSpaceAdminOnlyPostCategoryPosts = await generateForumPosts({
    count: hiddenPosts,
    categoryId: firstSpaceAdminOnlyPostCategory.id,
    title,
    createdBy: firstSpaceAdminUser.id,
    spaceId: firstSpace.id
  });
});

describe('POST /api/forums/posts/search - Search for posts', () => {
  it('should return posts that match the user search and they have access to, responding with 200', async () => {
    const userCookie = await loginUser(firstSpaceUser.id);
    const searchQuery: SearchForumPostsRequest = {
      categoryId: [firstSpaceAdminOnlyPostCategory.id, firstSpacePostCategory.id],
      search: title.substring(0, 4),
      spaceId: firstSpace.id,
      count: 20
    };

    const postSearchResult = (
      await request(baseUrl).post(`/api/forums/posts/search`).set('Cookie', userCookie).send(searchQuery).expect(200)
    ).body as PaginatedPostList;

    expect(postSearchResult.data).toHaveLength(visiblePosts);

    postSearchResult.data.forEach((post) => {
      // Make sure we have the expected posts
      expect(firstSpacePostCategoryPosts.some((_post) => _post.id === post.id));

      expect(post).toMatchObject(
        expect.objectContaining<Partial<ForumPostMeta>>({
          id: expect.any(String),
          summary: expect.any(Object)
        })
      );
    });
  });

  it('should return posts that match the admin user search, responding with 200', async () => {
    const adminUserCookie = await loginUser(firstSpaceAdminUser.id);
    const searchQuery: SearchForumPostsRequest = {
      search: title.substring(0, 4),
      spaceId: firstSpace.id,
      count: 20
    };

    const postSearchResult = (
      await request(baseUrl)
        .post(`/api/forums/posts/search`)
        .set('Cookie', adminUserCookie)
        .send(searchQuery)
        .expect(200)
    ).body as PaginatedPostList;

    expect(postSearchResult.data).toHaveLength(visiblePosts + hiddenPosts);

    const allPosts = [...firstSpaceAdminOnlyPostCategoryPosts, ...firstSpacePostCategoryPosts];

    postSearchResult.data.forEach((post) => {
      // Make sure we have the expected posts
      expect(allPosts.some((_post) => _post.id === post.id));

      expect(post).toMatchObject(
        expect.objectContaining<Partial<ForumPostMeta>>({
          id: expect.any(String),
          summary: expect.any(Object)
        })
      );
    });
  });

  it('should support empty queries, and return only posts accessible to the public for users outside the space, responding with 200', async () => {
    const userCookie = await loginUser(secondSpaceUser.id);

    // Search categories, but with no text
    const searchQuery: SearchForumPostsRequest = {
      categoryId: [firstSpaceAdminOnlyPostCategory.id, firstSpacePostCategory.id],
      spaceId: firstSpace.id,
      count: 20
    };

    const postSearchResult = (
      await request(baseUrl).post(`/api/forums/posts/search`).set('Cookie', userCookie).send(searchQuery).expect(200)
    ).body as PaginatedPostList;

    postSearchResult.data.forEach((post) => {
      // Make sure we have the expected posts
      expect(firstSpacePostCategoryPosts.some((_post) => _post.id === post.id));

      expect(postSearchResult.data).toHaveLength(visiblePosts);

      expect(post).toMatchObject(
        expect.objectContaining<Partial<ForumPostMeta>>({
          id: expect.any(String),
          summary: expect.any(Object)
        })
      );
    });
  });

  it('should return posts belonging to public categories for anonymous users, and respond with a 200', async () => {
    const { user: userInSpaceWithPublicCategory, space: spaceWithPublicCategory } = await generateUserAndSpace();

    const publicCategory = await generatePostCategory({
      spaceId: spaceWithPublicCategory.id,
      name: 'Public Category'
    });

    const publicPost = await generateForumPost({
      spaceId: spaceWithPublicCategory.id,
      categoryId: publicCategory.id,
      userId: userInSpaceWithPublicCategory.id,
      title: 'Public Post'
    });

    await upsertPostCategoryPermission({
      assignee: { group: 'public' },
      permissionLevel: 'view',
      postCategoryId: publicCategory.id
    });

    const privateCategory = await generatePostCategory({
      spaceId: spaceWithPublicCategory.id,
      name: 'Private Category'
    });

    const privatePost = await generateForumPost({
      spaceId: spaceWithPublicCategory.id,
      categoryId: privateCategory.id,
      userId: userInSpaceWithPublicCategory.id,
      title: 'Private Post'
    });

    const query: ListForumPostsRequest = {
      spaceId: spaceWithPublicCategory.id
    };

    const posts = (await request(baseUrl).post(`/api/forums/posts/search`).send(query).expect(200))
      .body as PaginatedPostList;

    expect(posts.data).toHaveLength(1);
    expect(posts.data[0].id).toBe(publicPost.id);
  });
});
