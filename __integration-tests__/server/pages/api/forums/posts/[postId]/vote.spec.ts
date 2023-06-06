/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Post, PostCategory, Space, User } from '@charmverse/core/prisma';
import { testUtilsForum, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import type { PostVote } from 'lib/forums/posts/voteForumPost';
import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';
import { baseUrl, loginUser } from 'testing/mockApiCall';

let space: Space;
let user: User;
let userCookie: string;
let adminUser: User;
let adminUserCookie: string;
let postCategory: PostCategory;
let post: Post;
let inaccessiblePostCategory: PostCategory;
let inaccessiblePost: Post;

beforeAll(async () => {
  const { space: _space, user: _user } = await testUtilsUser.generateUserAndSpace({ isAdmin: false });

  space = _space;
  user = _user;
  userCookie = await loginUser(user.id);
  adminUser = await testUtilsUser.generateSpaceUser({ isAdmin: true, spaceId: space.id });
  adminUserCookie = await loginUser(adminUser.id);

  postCategory = await testUtilsForum.generatePostCategory({
    name: 'Test Category',
    spaceId: space.id
  });

  post = await testUtilsForum.generateForumPost({
    spaceId: space.id,
    userId: adminUser.id,
    categoryId: postCategory.id
  });

  await upsertPostCategoryPermission({
    assignee: { group: 'space', id: space.id },
    permissionLevel: 'full_access',
    postCategoryId: postCategory.id
  });

  inaccessiblePostCategory = await testUtilsForum.generatePostCategory({
    spaceId: space.id
  });

  inaccessiblePost = await testUtilsForum.generateForumPost({
    spaceId: space.id,
    userId: adminUser.id,
    categoryId: inaccessiblePostCategory.id
  });
});

describe('POST /api/forums/posts/[postId]/vote - Vote on a post', () => {
  it('should allow a user with category permissions to vote on a forum post, responding with 200', async () => {
    const voteInput: Partial<PostVote> = {
      postId: post.id,
      upvoted: true
    };

    await request(baseUrl)
      .put(`/api/forums/posts/${post.id}/vote`)
      .set('Cookie', userCookie)
      .send(voteInput)
      .expect(200);
  });

  it('should always allow an admin to vote on a forum post, responding with 200', async () => {
    const voteInput: Partial<PostVote> = {
      postId: post.id,
      upvoted: true
    };

    await request(baseUrl)
      .put(`/api/forums/posts/${inaccessiblePost.id}/vote`)
      .set('Cookie', adminUserCookie)
      .send(voteInput)
      .expect(200);
  });

  it('should fail if user does not have permission to vote, responding with 401', async () => {
    const voteInput: Partial<PostVote> = {
      postId: post.id,
      upvoted: true
    };

    await request(baseUrl)
      .put(`/api/forums/posts/${inaccessiblePost.id}/vote`)
      .set('Cookie', userCookie)
      .send(voteInput)
      .expect(401);
  });
});
