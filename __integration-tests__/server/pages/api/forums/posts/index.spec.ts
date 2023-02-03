/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Post, PostCategory, Space, User } from '@prisma/client';
import request from 'supertest';

import { createPostCategory } from 'lib/forums/categories/createPostCategory';
import type { CreateForumPostInput } from 'lib/forums/posts/createForumPost';
import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
import { upsertPermission } from 'lib/permissions/pages';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generatePostCategory } from 'testing/utils/forums';

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
      categoryId: postCategory.id
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
      categoryId: postCategory.id
    };

    await request(baseUrl).post(`/api/forums/posts`).set('Cookie', userCookie).send(createInput).expect(401);
  });
});
