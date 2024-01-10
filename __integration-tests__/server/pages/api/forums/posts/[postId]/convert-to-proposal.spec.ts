import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsForum, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';
import { v4 } from 'uuid';

import { convertPostToProposal } from 'lib/forums/posts/convertPostToProposal';
import { baseUrl, loginUser } from 'testing/mockApiCall';

describe('POST /api/forums/posts/[postId]/convert-to-proposal - Convert post to proposal', () => {
  it('should succeed if the user has permission to create posts in this category, and respond 200', async () => {
    const { space, user: nonAdminUser1 } = await testUtilsUser.generateUserAndSpace({ isAdmin: false });

    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      userId: nonAdminUser1.id
    });

    await prisma.spacePermission.create({
      data: {
        forSpace: { connect: { id: space.id } },
        space: { connect: { id: space.id } },
        operations: ['createProposals']
      }
    });

    const nonAdminCookie = await loginUser(nonAdminUser1.id);

    await request(baseUrl)
      .post(`/api/forums/posts/${post.id}/convert-to-proposal`)
      .set('Cookie', nonAdminCookie)
      .expect(200);
  });

  it('should fail if the post does not exist, and respond 404', async () => {
    const { user: nonAdminUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false
    });

    const nonAdminCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl)
      .post(`/api/forums/posts/${v4()}/convert-to-proposal`)
      .set('Cookie', nonAdminCookie)

      .expect(404);
  });

  it('should fail if the post has been converted to proposal, and respond 401', async () => {
    const { space, user: nonAdminUser1 } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false
    });

    const nonAdminCookie = await loginUser(nonAdminUser1.id);

    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      userId: nonAdminUser1.id
    });

    await convertPostToProposal({
      post,
      userId: nonAdminUser1.id
    });

    await request(baseUrl)
      .post(`/api/forums/posts/${post.id}/convert-to-proposal`)
      .set('Cookie', nonAdminCookie)
      .expect(401);
  });

  it('should fail if its a draft post, and respond 401', async () => {
    const { space, user: nonAdminUser1 } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false
    });

    const nonAdminCookie = await loginUser(nonAdminUser1.id);

    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      userId: nonAdminUser1.id
    });

    await request(baseUrl)
      .post(`/api/forums/posts/${post.id}/convert-to-proposal`)
      .set('Cookie', nonAdminCookie)
      .expect(401);
  });

  it('should fail if the user does not have permission to create proposals in the space, and respond 401', async () => {
    const { space, user: nonAdminUser1 } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false
    });

    const nonAdminCookie = await loginUser(nonAdminUser1.id);

    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      userId: nonAdminUser1.id
    });

    await request(baseUrl)
      .post(`/api/forums/posts/${post.id}/convert-to-proposal`)
      .set('Cookie', nonAdminCookie)
      .expect(401);
  });
});
