/* eslint-disable @typescript-eslint/no-unused-vars */
import type { PostCategory, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpace } from '@packages/testing/setupDatabase';
import { generateForumPost, generatePostCategory, generatePostWithComment } from '@packages/testing/utils/forums';
import request from 'supertest';
import { v4 } from 'uuid';

import type { PostCommentWithVote } from '@packages/lib/forums/comments/interface';
import { upsertPostCategoryPermission } from '@packages/lib/permissions/forum/upsertPostCategoryPermission';

let space: Space;
let user: User;
let otherUser: User;
let userCookie: string;
let otherUserCookie: string;

let accessiblePostCategory: PostCategory;
let disallowedPostCategory: PostCategory;
beforeAll(async () => {
  const { space: _space, user: _user } = await generateUserAndSpace({ isAdmin: false });
  const { user: _user2 } = await generateUserAndSpace({ isAdmin: false });
  otherUser = await generateSpaceUser({ spaceId: _space.id, isAdmin: false });

  space = _space;
  user = _user;

  otherUser = _user2;

  userCookie = await loginUser(user.id);
  otherUserCookie = await loginUser(otherUser.id);

  accessiblePostCategory = await generatePostCategory({
    spaceId: space.id
  });

  await upsertPostCategoryPermission({
    permissionLevel: 'full_access',
    postCategoryId: accessiblePostCategory.id,
    assignee: { group: 'space', id: space.id }
  });

  disallowedPostCategory = await generatePostCategory({
    spaceId: space.id
  });
});

describe('GET /api/forums/posts/[postId]/comments - Get comments of a post', () => {
  it('should return a list of post comments with vote information, responding with 200', async () => {
    const post = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      categoryId: accessiblePostCategory.id
    });

    const comments = (
      await request(baseUrl).get(`/api/forums/posts/${post.id}/comments`).set('Cookie', userCookie).expect(200)
    ).body;

    expect(comments).toBeInstanceOf(Array);
  });

  it('should return a list of post comments with vote information to a non logged in user if the post is in a public category, responding with 200', async () => {
    await upsertPostCategoryPermission({
      permissionLevel: 'view',
      postCategoryId: accessiblePostCategory.id,
      assignee: { group: 'public' }
    });

    const postWithComment = await generatePostWithComment({
      userId: user.id,
      spaceId: space.id,
      categoryId: accessiblePostCategory.id
    });

    await prisma.postCommentUpDownVote.create({
      data: {
        createdBy: user.id,
        upvoted: true,
        comment: { connect: { id: postWithComment.comment.id } },
        post: { connect: { id: postWithComment.post.id } }
      }
    });

    const comments = (await request(baseUrl).get(`/api/forums/posts/${postWithComment.post.id}/comments`).expect(200))
      .body as PostCommentWithVote[];

    expect(comments.length).toBe(1);
    expect(comments[0].id).toBe(postWithComment.comment.id);
    expect(comments[0].content).toEqual(postWithComment.comment.content);
    expect(comments[0].upvotes).toEqual(1);
    expect(comments[0].downvotes).toEqual(0);
  });

  it('should throw an error if user does not have permissions to view this category, responding with 401', async () => {
    const post = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      categoryId: disallowedPostCategory.id
    });

    await request(baseUrl).get(`/api/forums/posts/${post.id}/comments`).set('Cookie', otherUserCookie).expect(401);
  });
});
describe('POST /api/forums/posts/[postId]/comments - Create a comment', () => {
  it('should create comment, responding with 200', async () => {
    const post = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      categoryId: accessiblePostCategory.id
    });

    await request(baseUrl)
      .post(`/api/forums/posts/${post.id}/comments`)
      .send({
        content: null,
        contentText: '',
        parentId: v4()
      })
      .set('Cookie', userCookie)
      .expect(200);
  });

  it('should throw error if post is not found, responding with 404', async () => {
    await request(baseUrl).post(`/api/forums/posts/${v4()}/comments`).set('Cookie', userCookie).expect(404);
  });

  it(`should throw error if user doesn't have permissions to access the category, responding with 401`, async () => {
    const post = await generateForumPost({
      userId: user.id,
      spaceId: space.id,
      categoryId: disallowedPostCategory.id
    });

    await request(baseUrl).post(`/api/forums/posts/${post.id}/comments`).send({}).set('Cookie', userCookie).expect(401);
  });
});
