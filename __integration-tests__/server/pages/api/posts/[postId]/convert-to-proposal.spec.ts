import request from 'supertest';
import { v4 } from 'uuid';

import { convertPostToProposal } from 'lib/forums/posts/convertPostToProposal';
import { addSpaceOperations } from 'lib/permissions/spaces';
import { generateForumPosts } from 'testing/forums';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('POST /api/forums/posts/[postId]/convert-to-proposal - Convert post to proposal', () => {
  it('should succeed if the user has permission, and respond 200', async () => {
    const { space, user: nonAdminUser1 } = await generateUserAndSpaceWithApiToken(undefined, false);

    const nonAdminCookie = await loginUser(nonAdminUser1.id);

    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['createVote'],
      spaceId: space.id
    });

    const posts = await generateForumPosts({
      spaceId: space.id,
      createdBy: nonAdminUser1.id,
      count: 5
    });

    await request(baseUrl)
      .post(`/api/forums/posts/${posts[0].id}/convert-to-proposal`)
      .set('Cookie', nonAdminCookie)
      .expect(200);
  });

  it('should fail if the post does not exist, and respond 404', async () => {
    const { user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const nonAdminCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl)
      .post(`/api/forums/posts/${v4()}/convert-to-proposal`)
      .set('Cookie', nonAdminCookie)
      .expect(404);
  });

  it('should fail if the post has been converted to proposal, and respond 401', async () => {
    const { space, user: nonAdminUser1 } = await generateUserAndSpaceWithApiToken(undefined, false);

    const nonAdminCookie = await loginUser(nonAdminUser1.id);

    const posts = await generateForumPosts({
      spaceId: space.id,
      createdBy: nonAdminUser1.id,
      count: 5
    });

    await convertPostToProposal({
      post: posts[0],
      userId: nonAdminUser1.id
    });

    await request(baseUrl)
      .post(`/api/forums/posts/${posts[0].id}/convert-to-proposal`)
      .set('Cookie', nonAdminCookie)
      .expect(401);
  });

  it('should fail if the user does not have createVote space permission, and respond 401', async () => {
    const { space, user: nonAdminUser1 } = await generateUserAndSpaceWithApiToken(undefined, false);

    const nonAdminCookie = await loginUser(nonAdminUser1.id);

    const posts = await generateForumPosts({
      spaceId: space.id,
      createdBy: nonAdminUser1.id,
      count: 5
    });

    await request(baseUrl)
      .post(`/api/forums/posts/${posts[0].id}/convert-to-proposal`)
      .set('Cookie', nonAdminCookie)
      .expect(401);
  });
});
