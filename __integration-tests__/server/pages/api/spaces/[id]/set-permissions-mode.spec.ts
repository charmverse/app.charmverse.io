/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space } from '@charmverse/core/prisma';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import request from 'supertest';

import type { SpacePermissionConfigurationUpdate } from 'lib/permissions/meta';

describe('POST /api/spaces/[id]/set-permissions-mode - Define if the space should use a preset permissions mode or a custom one', () => {
  it('should update the space permissions mode if user is admin and return the space, responding with 200', async () => {
    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    const userCookie = await loginUser(adminUser.id);

    const update: Pick<SpacePermissionConfigurationUpdate, 'permissionConfigurationMode'> = {
      permissionConfigurationMode: 'readOnly'
    };

    const updatedSpace = (
      await request(baseUrl)
        .post(`/api/spaces/${space.id}/set-permissions-mode`)
        .set('Cookie', userCookie)
        .send(update)
        .expect(200)
    ).body as Space;

    expect(updatedSpace.permissionConfigurationMode).toBe('readOnly');
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const userCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl)
      .post(`/api/spaces/${space.id}/set-permissions-mode`)
      .set('Cookie', userCookie)
      .send({
        defaultPublicPage: true
      })
      .expect(401);
  });
});
