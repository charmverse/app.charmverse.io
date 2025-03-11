/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space } from '@charmverse/core/prisma';
import { testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

describe('POST /api/spaces/[id]/set-default-public-page - Set whether newly created root pages in a space should be public by default', () => {
  it('should update the space default if user is admin, and return the space, responding with 200', async () => {
    const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({ isAdmin: true });

    const userCookie = await loginUser(adminUser.id);

    const updatedSpace = (
      await request(baseUrl)
        .post(`/api/spaces/${space.id}/set-default-public-pages`)
        .set('Cookie', userCookie)
        .send({
          defaultPublicPages: true
        })
        .expect(200)
    ).body as Space;

    expect(updatedSpace.defaultPublicPages).toBe(true);
    expect(updatedSpace.id).toBe(space.id);
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    const { space, user: nonAdminUser } = await testUtilsUser.generateUserAndSpace();

    const userCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl)
      .post(`/api/spaces/${space.id}/set-default-public-pages`)
      .set('Cookie', userCookie)
      .send({
        defaultPublicPage: true
      })
      .expect(401);
  });
});
