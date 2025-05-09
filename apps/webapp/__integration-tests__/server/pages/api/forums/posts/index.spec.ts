/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Post, Space, User } from '@charmverse/core/prisma';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import {
  generateSpaceUser,
  generateUserAndSpace,
  generateUserAndSpaceWithApiToken
} from '@packages/testing/setupDatabase';
import { generateForumPost, generatePostCategory } from '@packages/testing/utils/forums';
import request from 'supertest';

import type { CreateForumPostInput } from '@packages/lib/forums/posts/createForumPost';
import type { ListForumPostsRequest, PaginatedPostList } from '@packages/lib/forums/posts/listForumPosts';
import { upsertPostCategoryPermission } from '@packages/lib/permissions/forum/upsertPostCategoryPermission';

let space: Space;
let user: User;
let userCookie: string;
beforeAll(async () => {
  const { space: _space, user: _firstAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

  space = _space;
  user = _firstAdminUser;
  user = await generateSpaceUser({ isAdmin: false, spaceId: space.id });
  userCookie = await loginUser(user.id);
});

describe('GET /api/forums/posts', () => {
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

    const posts = (await request(baseUrl).get(`/api/forums/posts`).query(query).expect(200)).body as PaginatedPostList;

    expect(posts.data).toHaveLength(1);
    expect(posts.data[0].id).toBe(publicPost.id);
  });
});

describe('POST /api/forums/posts - Create a post', () => {
  it('should create a post if the user can create posts in this category, responding with 201', async () => {
    const postCategory = await generatePostCategory({
      spaceId: space.id
    });

    await upsertPostCategoryPermission({
      postCategoryId: postCategory.id,
      permissionLevel: 'full_access',
      assignee: { group: 'space', id: space.id }
    });
    const createInput: CreateForumPostInput = {
      content: { type: 'doc' },
      contentText: 'Empty',
      spaceId: space.id,
      title: 'Test Post',
      createdBy: user.id,
      categoryId: postCategory.id,
      isDraft: false
    };

    const post = (
      await request(baseUrl).post(`/api/forums/posts`).set('Cookie', userCookie).send(createInput).expect(201)
    ).body as Post;

    expect(post).toMatchObject(
      expect.objectContaining<Partial<Post>>({
        id: expect.any(String),
        content: expect.any(Object),
        locked: false,
        pinned: false
      })
    );
  });

  it('should fail to create the post if the user does not have permissions to create a post in the category, responding with 401', async () => {
    const postCategory = await generatePostCategory({
      spaceId: space.id
    });

    await upsertPostCategoryPermission({
      postCategoryId: postCategory.id,
      permissionLevel: 'view',
      assignee: { group: 'space', id: space.id }
    });
    const createInput: CreateForumPostInput = {
      content: { type: 'doc' },
      contentText: 'Empty',
      spaceId: space.id,
      title: 'Test Post',
      createdBy: user.id,
      categoryId: postCategory.id,
      isDraft: false
    };

    await request(baseUrl).post(`/api/forums/posts`).set('Cookie', userCookie).send(createInput).expect(401);
  });
});
