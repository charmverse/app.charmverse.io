import { testUtilsForum, testUtilsProposals, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import { baseUrl, loginUser } from 'testing/mockApiCall';

describe('POST /api/forums/posts/[postId]/convert-to-proposal - Convert post to proposal - public space', () => {
  it('should succeed if the user is a space member, and respond 200', async () => {
    const { space, user: nonAdminUser1 } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false,
      spacePaidTier: 'free'
    });
    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      userId: nonAdminUser1.id
    });

    const proposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    const nonAdminCookie = await loginUser(nonAdminUser1.id);

    await request(baseUrl)
      .post(`/api/forums/posts/${post.id}/convert-to-proposal`)
      .set('Cookie', nonAdminCookie)
      .expect(200);
  });

  it('should fail if the user is not a space member, and respond 401', async () => {
    const { space, user } = await testUtilsUser.generateUserAndSpace({
      spacePaidTier: 'free',
      isAdmin: false
    });

    const { user: outsideUser } = await testUtilsUser.generateUserAndSpace();

    const post = await testUtilsForum.generateForumPost({
      spaceId: space.id,
      userId: user.id
    });

    const proposalCategory = await testUtilsProposals.generateProposalCategory({
      spaceId: space.id
    });

    const outsideUserCookie = await loginUser(outsideUser.id);

    await request(baseUrl)
      .post(`/api/forums/posts/${post.id}/convert-to-proposal`)
      .set('Cookie', outsideUserCookie)
      .send({
        categoryId: proposalCategory.id
      })
      .expect(401);
  });
});
