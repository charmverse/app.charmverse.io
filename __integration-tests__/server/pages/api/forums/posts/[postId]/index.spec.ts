/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Post, PostCategory, Space, User } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateForumPost, generatePostCategory } from '@packages/testing/utils/forums';
import request from 'supertest';

import type { PostWithVotes } from 'lib/forums/posts/interfaces';
import type { UpdateForumPostInput } from 'lib/forums/posts/updateForumPost';
import { upsertPostCategoryPermission } from 'lib/permissions/forum/upsertPostCategoryPermission';

let space: Space;
let user: User;
let userCookie: string;
let adminUser: User;
let adminUserCookie: string;
let extraSpaceUser: User;
let extraSpaceUserCookie: string;
let postCategory: PostCategory;
let createInput: { spaceId: string; userId: string; categoryId: string };
const updateInput: UpdateForumPostInput = {
  title: 'New title'
};

beforeAll(async () => {
  const { space: _space, user: _user } = await testUtilsUser.generateUserAndSpace({ isAdmin: false });

  space = _space;
  user = _user;
  userCookie = await loginUser(user.id);
  adminUser = await testUtilsUser.generateSpaceUser({ isAdmin: true, spaceId: space.id });
  adminUserCookie = await loginUser(adminUser.id);

  postCategory = await generatePostCategory({
    name: 'Test Category',
    spaceId: space.id
  });

  await upsertPostCategoryPermission({
    assignee: { group: 'space', id: space.id },
    permissionLevel: 'view',
    postCategoryId: postCategory.id
  });

  createInput = {
    spaceId: space.id,
    userId: user.id,
    categoryId: postCategory.id
  };

  extraSpaceUser = await testUtilsUser.generateSpaceUser({ isAdmin: false, spaceId: space.id });

  extraSpaceUserCookie = await loginUser(extraSpaceUser.id);
});

describe('PUT /api/forums/posts/[postId] - Update a post', () => {
  it('should update a post if the user created it, responding with 200', async () => {
    const post = await generateForumPost(createInput);

    await request(baseUrl).put(`/api/forums/posts/${post.id}`).set('Cookie', userCookie).send(updateInput).expect(200);
  });
  it('should fail to update the post if the user did not create it even if they are an admin, responding with 401', async () => {
    const post = await generateForumPost(createInput);

    await request(baseUrl)
      .put(`/api/forums/posts/${post.id}`)
      .set('Cookie', adminUserCookie)
      .send(updateInput)
      .expect(401);
  });

  it('should fail to update the post to a new category if the author cannot create posts in that category, responding with 401', async () => {
    const post = await generateForumPost(createInput);

    const unauthorisedCategory = await generatePostCategory({
      spaceId: space.id,
      name: 'Unauthorised category'
    });

    await request(baseUrl)
      .put(`/api/forums/posts/${post.id}`)
      .set('Cookie', adminUserCookie)
      .send({
        ...updateInput,
        categoryId: unauthorisedCategory.id
      } as UpdateForumPostInput)
      .expect(401);
  });
});
describe('DELETE /api/forums/posts/[postId] - Delete a post', () => {
  it('should delete a post if the user created it, responding with 200', async () => {
    const post = await generateForumPost(createInput);

    await request(baseUrl).delete(`/api/forums/posts/${post.id}`).set('Cookie', userCookie).send().expect(200);

    const postAfterDelete = await prisma.post.findUnique({
      where: {
        id: post.id
      }
    });

    expect(postAfterDelete?.deletedAt).toBeDefined();
  });

  it('should delete a post if the user has the permissions for this, responding with 200', async () => {
    const role = await testUtilsMembers.generateRole({
      spaceId: space.id,
      createdBy: adminUser.id,
      assigneeUserIds: [extraSpaceUser.id]
    });

    const moderatedPostCategory = await prisma.postCategory.create({
      data: {
        name: 'Moderated category',
        space: { connect: { id: space.id } },
        postCategoryPermissions: {
          create: {
            permissionLevel: 'moderator',
            role: { connect: { id: role.id } }
          }
        }
      }
    });

    const post = await generateForumPost({
      ...createInput,
      categoryId: moderatedPostCategory.id
    });
    await request(baseUrl).delete(`/api/forums/posts/${post.id}`).set('Cookie', extraSpaceUserCookie).expect(200);

    const postAfterDelete = await prisma.post.findUnique({
      where: {
        id: post.id
      }
    });

    expect(postAfterDelete?.deletedAt).toBeDefined();
  });

  it('should fail to delete the post if the user does not have permissions to do so in this category, responding with 401', async () => {
    const page = await generateForumPost(createInput);

    await request(baseUrl).delete(`/api/forums/posts/${page.id}`).set('Cookie', extraSpaceUserCookie).expect(401);
  });
});
describe('GET /api/forums/posts/[postId] - Get a post', () => {
  it('should return a post if the user has permissions for this category, responding with 200', async () => {
    const post = await generateForumPost(createInput);

    const retrievedPost = (
      await request(baseUrl).get(`/api/forums/posts/${post.id}`).set('Cookie', userCookie).send().expect(200)
    ).body as PostWithVotes;

    // The retrieved post will have votes data, which the original generated post will not have
    expect(retrievedPost).toMatchObject(
      expect.objectContaining<Partial<PostWithVotes>>({
        id: post.id,
        categoryId: post.categoryId,
        spaceId: post.spaceId,
        content: post.content,
        title: post.title,
        contentText: post.contentText,
        path: post.path,
        locked: post.locked,
        pinned: post.pinned,
        votes: {
          downvotes: 0,
          upvotes: 0,
          upvoted: null
        }
      })
    );
  });
  it('should support querying the post by space domain and path, responding with 200', async () => {
    const post = await generateForumPost(createInput);

    const retrievedPost = (
      await request(baseUrl)
        .get(`/api/forums/posts/${post.path}?spaceDomain=${space.domain}`)
        .set('Cookie', userCookie)
        .send()
        .expect(200)
    ).body as PostWithVotes;

    // The retrieved post will have votes data, which the original generated post will not have
    expect(retrievedPost).toMatchObject(
      expect.objectContaining<Partial<PostWithVotes>>({
        id: post.id,
        categoryId: post.categoryId,
        spaceId: post.spaceId,
        content: post.content,
        title: post.title,
        contentText: post.contentText,
        path: post.path,
        locked: post.locked,
        pinned: post.pinned,
        votes: {
          downvotes: 0,
          upvotes: 0,
          upvoted: null
        }
      })
    );
  });

  it('should return the post if a user is not logged in, but the post belongs to a public category, responding with 200', async () => {
    const publicCategory = await generatePostCategory({
      spaceId: space.id,
      name: 'Public category'
    });
    await upsertPostCategoryPermission({
      assignee: { group: 'public' },
      permissionLevel: 'view',
      postCategoryId: publicCategory.id
    });
    const publicPost = await generateForumPost({
      spaceId: space.id,
      categoryId: publicCategory.id,
      userId: user.id
    });

    const postFromApi = (await request(baseUrl).get(`/api/forums/posts/${publicPost.id}`).send().expect(200))
      .body as Post;

    expect(postFromApi).toMatchObject(
      expect.objectContaining<Partial<Post>>({
        id: publicPost.id,
        categoryId: publicPost.categoryId,
        content: publicPost.content
      })
    );
  });

  it('should fail to return the post if the user does not have permissions for this category, responding with 401', async () => {
    const { user: externalUser } = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
    const externalUserCookie = await loginUser(externalUser.id);

    const post = await generateForumPost(createInput);

    await request(baseUrl).get(`/api/forums/posts/${post.id}`).set('Cookie', externalUserCookie).send().expect(401);
  });

  it('should fail if a non-drafted post is converted to a drafted post, responding with 401', async () => {
    const { user: externalUser } = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
    const externalUserCookie = await loginUser(externalUser.id);

    const post = await generateForumPost({ ...createInput, isDraft: false });

    await request(baseUrl)
      .get(`/api/forums/posts/${post.id}`)
      .set('Cookie', externalUserCookie)
      .send({ isDraft: true })
      .expect(401);
  });
});
