/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space } from '@prisma/client';
import request from 'supertest';

import { updateSpacePermissionConfigurationMode } from 'lib/permissions/meta';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('POST /api/spaces/[id]/set-default-public-page - Set whether newly created root pages in a space should be public by default', () => {
  it('should update the space default if user is admin, and return the space, responding with 200', async () => {

    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    const userCookie = await loginUser(adminUser.id);

    const updatedSpace = (await request(baseUrl)
      .post(`/api/spaces/${space.id}/set-default-public-pages`)
      .set('Cookie', userCookie)
      .send({
        defaultPublicPages: true
      })
      .expect(200)).body as Space;

    expect(updatedSpace.defaultPublicPages).toBe(true);
    expect(updatedSpace.id).toBe(space.id);
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const userCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl)
      .post(`/api/spaces/${space.id}/set-default-public-pages`)
      .set('Cookie', userCookie)
      .send({
        defaultPublicPage: true
      })
      .expect(401);

  });

  it('should fail if the user is admin, but the space permission mode is not "custom", and respond 401', async () => {

    const { space: extraSpace, user: extraAdminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    await updateSpacePermissionConfigurationMode({
      spaceId: extraSpace.id,
      permissionConfigurationMode: 'collaborative'
    });

    const userCookie = await loginUser(extraAdminUser.id);

    await request(baseUrl)
      .post(`/api/spaces/${extraSpace.id}/set-default-public-pages`)
      .set('Cookie', userCookie)
      .send({
        defaultPublicPage: true
      })
      .expect(401);
  });
});
