/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PostCategory, Space, User } from '@charmverse/core/prisma';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generatePostWithComment, generatePostCategory } from '@packages/testing/utils/forums';
import request from 'supertest';

import type { UpdatePostCommentInput } from '@packages/lib/forums/comments/interface';
import type { CreateForumPostInput } from '@packages/lib/forums/posts/createForumPost';

let space: Space;
let user: User;
let nonSpaceUser: User;
let userCookie: string;
let nonSpaceUserCookie: string;
let adminUser: User;
let adminUserCookie: string;
let extraSpaceUser: User;
let extraSpaceUserCookie: string;
let postCategory: PostCategory;
// A post created by user, which extraSpaceUser and adminUser will try to edit
let createInput: CreateForumPostInput;
const updateInput: UpdatePostCommentInput = {
  content: {
    type: 'paragraph'
  },
  contentText: ''
};

beforeAll(async () => {
  const { space: _space, user: _user } = await generateUserAndSpaceWithApiToken(undefined, false);
  const { space: _space2, user: _user2 } = await generateUserAndSpaceWithApiToken(undefined, false);

  space = _space;
  user = _user;
  nonSpaceUser = _user2;
  userCookie = await loginUser(user.id);
  nonSpaceUserCookie = await loginUser(nonSpaceUser.id);
  adminUser = await generateSpaceUser({ isAdmin: true, spaceId: space.id });
  adminUserCookie = await loginUser(adminUser.id);

  postCategory = await generatePostCategory({
    name: 'Test Category',
    spaceId: space.id
  });

  createInput = {
    content: { type: 'doc' },
    contentText: 'Empty',
    spaceId: space.id,
    title: 'Test Post',
    createdBy: user.id,
    categoryId: postCategory.id,
    isDraft: false
  };

  extraSpaceUser = await generateSpaceUser({ isAdmin: false, spaceId: space.id });

  extraSpaceUserCookie = await loginUser(extraSpaceUser.id);
});

describe('PUT /api/forums/posts/[postId]/comments/[commentId] - Update a comment', () => {
  it('should update post comment if user is the author, responding with 200', async () => {
    const { comment, post } = await generatePostWithComment({
      spaceId: space.id,
      userId: user.id
    });
    await request(baseUrl)
      .put(`/api/forums/posts/${post.id}/comments/${comment.id}`)
      .set('Cookie', userCookie)
      .send(updateInput)
      .expect(200);
  });

  it('should fail to update post comment, even if user is a space admin, responding with 401', async () => {
    const { comment, post } = await generatePostWithComment({
      spaceId: space.id,
      userId: user.id
    });
    await request(baseUrl)
      .put(`/api/forums/posts/${post.id}/comments/${comment.id}`)
      .set('Cookie', adminUserCookie)
      .send(updateInput)
      .expect(401);
  });

  it(`should fail to update the post comment if user doesn't have access to workspace, responding with 401`, async () => {
    const { comment, post } = await generatePostWithComment({
      spaceId: space.id,
      userId: user.id
    });
    await request(baseUrl)
      .put(`/api/forums/posts/${post.id}/comments/${comment.id}`)
      .set('Cookie', nonSpaceUserCookie)
      .send(updateInput)
      .expect(401);
  });
});

describe('DELETE /api/forums/posts/[postId]/comments/[commentId] - Delete a comment', () => {
  it('should delete post comment if user is the author, responding with 200', async () => {
    const { comment, post } = await generatePostWithComment({
      spaceId: space.id,
      userId: user.id
    });
    await request(baseUrl)
      .delete(`/api/forums/posts/${post.id}/comments/${comment.id}`)
      .set('Cookie', userCookie)
      .query(updateInput)
      .expect(200);
  });

  it('should delete post comment, if user is a space admin, responding with 200', async () => {
    const { comment, post } = await generatePostWithComment({
      spaceId: space.id,
      userId: user.id
    });
    await request(baseUrl)
      .delete(`/api/forums/posts/${post.id}/comments/${comment.id}`)
      .set('Cookie', adminUserCookie)
      .query(updateInput)
      .expect(200);
  });

  it(`should fail to delete the post comment if user is another space member, responding with 401`, async () => {
    const { comment, post } = await generatePostWithComment({
      spaceId: space.id,
      userId: user.id
    });
    await request(baseUrl)
      .delete(`/api/forums/posts/${post.id}/comments/${comment.id}`)
      .set('Cookie', extraSpaceUserCookie)
      .query(updateInput)
      .expect(401);
  });

  it(`should fail to delete the post comment if user doesn't have access to workspace, responding with 401`, async () => {
    const { comment, post } = await generatePostWithComment({
      spaceId: space.id,
      userId: user.id
    });
    await request(baseUrl)
      .delete(`/api/forums/posts/${post.id}/comments/${comment.id}`)
      .set('Cookie', nonSpaceUserCookie)
      .query(updateInput)
      .expect(401);
  });
});
