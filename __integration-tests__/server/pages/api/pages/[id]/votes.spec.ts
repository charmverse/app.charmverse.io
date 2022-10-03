import { createPage, createVote, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { v4 } from 'uuid';
import { upsertPermission } from 'lib/permissions/pages';

describe('GET /api/pages/{id}/votes - Get all the votes for a specific page', () => {
  it('should get votes of a page for the admin user and return it, responding with 200', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(v4(), true);
    const userCookie = await loginUser(user.id);
    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await createVote({
      createdBy: user.id,
      pageId: page.id,
      spaceId: space.id
    });

    await request(baseUrl)
      .get(`/api/pages/${page.id}/votes`)
      .set('Cookie', userCookie)
      .expect(200);
  });

  it('should get votes of a page for a contributor who has read access, responding with 200', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(v4(), false);

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await createVote({
      createdBy: user.id,
      pageId: page.id,
      spaceId: space.id
    });

    await upsertPermission(page.id, {
      permissionLevel: 'full_access',
      userId: user.id
    });

    await request(baseUrl)
      .get(`/api/pages/${page.id}/votes`)
      .set('Cookie', await loginUser(user.id))
      .expect(200);
  });

  it('should fail to get votes of a page for a contributor who doesn\'t have read access, responding with 404', async () => {
    const { user, space } = await generateUserAndSpaceWithApiToken(v4(), false);

    const page = await createPage({
      createdBy: user.id,
      spaceId: space.id
    });

    await createVote({
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
    const { user: userInSpace, space } = await generateUserAndSpaceWithApiToken(v4(), true);
    const { user: userNotInSpace } = await generateUserAndSpaceWithApiToken(v4(), false);

    const page = await createPage({
      createdBy: userInSpace.id,
      spaceId: space.id
    });

    await createVote({
      createdBy: userInSpace.id,
      pageId: page.id,
      spaceId: space.id
    });

    await request(baseUrl)
      .get(`/api/pages/${page.id}/votes`)
      .set('Cookie', await loginUser(userNotInSpace.wallets[0].address))
      .expect(404);
  });
});
