import { testUtilsPages, testUtilsUser, testUtilsVotes } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

describe('GET /api/pages/{id}/votes - Get all the votes for a specific page', () => {
  it('should get votes of a page for the admin user and return it, responding with 200', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    const userCookie = await loginUser(user.id);
    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    await testUtilsVotes.generateVote({
      createdBy: user.id,
      pageId: page.id,
      spaceId: space.id
    });

    await request(baseUrl).get(`/api/pages/${page.id}/votes`).set('Cookie', userCookie).expect(200);
  });

  it('should get votes of a page for a member who has read access, responding with 200', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id,
      pagePermissions: [
        {
          permissionLevel: 'full_access',
          assignee: { group: 'user', id: user.id }
        }
      ]
    });

    await testUtilsVotes.generateVote({
      createdBy: user.id,
      pageId: page.id,
      spaceId: space.id
    });

    await request(baseUrl)
      .get(`/api/pages/${page.id}/votes`)
      .set('Cookie', await loginUser(user.id))
      .expect(200);
  });

  it("should fail to get votes of a page for a member who doesn't have read access, responding with 404", async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false
    });

    const page = await testUtilsPages.generatePage({
      createdBy: user.id,
      spaceId: space.id
    });

    await testUtilsVotes.generateVote({
      createdBy: user.id,
      pageId: page.id,
      spaceId: space.id
    });

    await request(baseUrl)
      .get(`/api/pages/${page.id}/votes`)
      .set('Cookie', await loginUser(user.id))
      .expect(404);
  });

  it('should fail to get votes of a page for a user not part of the space, responding with 404', async () => {
    const { user: userInSpace, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });
    const { user: userNotInSpace } = await testUtilsUser.generateUserAndSpace({
      isAdmin: false
    });

    const page = await testUtilsPages.generatePage({
      createdBy: userInSpace.id,
      spaceId: space.id
    });

    await testUtilsVotes.generateVote({
      createdBy: userInSpace.id,
      pageId: page.id,
      spaceId: space.id
    });

    await request(baseUrl)
      .get(`/api/pages/${page.id}/votes`)
      .set('Cookie', await loginUser(userNotInSpace.id))
      .expect(404);
  });
});
