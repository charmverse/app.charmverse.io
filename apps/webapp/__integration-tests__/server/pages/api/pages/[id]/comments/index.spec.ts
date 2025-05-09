import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsPages, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { createPage, generatePageComment } from '@packages/testing/setupDatabase';
import request from 'supertest';

describe('GET /api/pages/[id]/comments - fetch comments of a page', () => {
  it('should allow a user with access to the space to fetch comments with status code 200', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
    const userCookie = await loginUser(user.id);

    const page = await createPage({
      spaceId: space.id,
      createdBy: user.id,
      pagePermissions: [
        {
          userId: user.id,
          permissionLevel: 'view'
        }
      ]
    });
    const comment = await generatePageComment({
      createdBy: user.id,
      pageId: page.id
    });
    const result = await request(baseUrl).get(`/api/pages/${page.id}/comments`).set('Cookie', userCookie).expect(200);
    expect(result.body).toHaveLength(1);
    expect(result.body).toEqual(expect.arrayContaining([expect.objectContaining({ id: comment.id })]));
  });

  it('should not allow a user without access to the space to fetch comments and respond with 401', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace();
    const otherUser = await testUtilsUser.generateUser();
    const userCookie = await loginUser(otherUser.id);
    const { page } = await testUtilsPages.generateCommentWithThreadAndPage({
      commentContent: 'Message',
      spaceId: space.id,
      userId: user.id
    });

    await request(baseUrl).get(`/api/pages/${page.id}/comments`).set('Cookie', userCookie).expect(401);
  });
});
