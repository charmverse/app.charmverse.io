/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Post, PostCategory, Space, User } from '@prisma/client';
import request from 'supertest';

import { createPostCategory } from 'lib/forums/categories/createPostCategory';
import type { CreateForumPostInput } from 'lib/forums/posts/createForumPost';
import type { ForumPostMeta } from 'lib/forums/posts/interfaces';
import type { PaginatedPostList } from 'lib/forums/posts/listForumPosts';
import type { SearchForumPostsRequest } from 'lib/forums/posts/searchForumPosts';
import { generateForumPosts } from 'testing/forums';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let firstSpace: Space;
let firstSpaceUser: User;
let firstSpacePostCategory: PostCategory;
let secondSpace: Space;
let secondSpaceUser: User;

beforeAll(async () => {
  const { space: _firstSpace, user: _firstAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

  firstSpace = _firstSpace;
  firstSpaceUser = _firstAdminUser;
  firstSpaceUser = await generateSpaceUser({ isAdmin: false, spaceId: firstSpace.id });

  const { space: _secondSpace, user: _secondUser } = await generateUserAndSpaceWithApiToken(undefined, false);

  secondSpace = _secondSpace;
  secondSpaceUser = _secondUser;

  firstSpacePostCategory = await createPostCategory({
    name: 'Test Category',
    spaceId: firstSpace.id
  });
});

describe('POST /api/forums/posts/search - Search for posts', () => {
  it('should return posts that match the user search, responding with 200', async () => {
    const userCookie = await loginUser(firstSpaceUser.id);

    const title = `Should show up in the search`;

    const postsToCreate = 4;
    const postsToIgnore = 2;

    const posts = await generateForumPosts({
      count: postsToCreate,
      title,
      createdBy: firstSpaceUser.id,
      spaceId: firstSpace.id
    });

    const ignoredPosts = await generateForumPosts({
      count: postsToIgnore,
      title: 'Ignored posts',
      createdBy: firstSpaceUser.id,
      spaceId: firstSpace.id
    });

    const searchQuery: SearchForumPostsRequest = {
      search: title.substring(0, 4),
      spaceId: firstSpace.id,
      count: 20
    };

    const postSearchResult = (
      await request(baseUrl).post(`/api/forums/posts/search`).set('Cookie', userCookie).send(searchQuery).expect(200)
    ).body as PaginatedPostList;

    expect(postSearchResult.data).toHaveLength(postsToCreate);

    postSearchResult.data.forEach((post) => {
      // Make sure we have the expected posts
      expect(posts.some((_post) => _post.id === post.id));

      expect(post).toMatchObject(
        expect.objectContaining<Partial<ForumPostMeta>>({
          id: expect.any(String),
          summary: expect.any(Object)
        })
      );
    });
  });

  it('should fail if the user is not a member of the target space, responding with 401', async () => {
    const userCookie = await loginUser(secondSpaceUser.id);

    const searchQuery: SearchForumPostsRequest = {
      search: 'Title of the post',
      spaceId: firstSpace.id,
      count: 20
    };

    await request(baseUrl).post(`/api/forums/posts/search`).set('Cookie', userCookie).send(searchQuery).expect(401);
  });
});
