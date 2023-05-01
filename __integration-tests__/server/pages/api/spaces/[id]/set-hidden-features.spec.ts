/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space } from '@charmverse/core/dist/prisma';
import request from 'supertest';

import type { SpaceHiddenFeatures } from 'lib/spaces/setHiddenFeatures';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('POST /api/spaces/[id]/set-hidden-features - Set hidden features for the space', () => {
  it('should update the feature blacklist if user is admin, and return the space, responding with 200', async () => {
    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    const userCookie = await loginUser(adminUser.id);

    const updatedSpace = (
      await request(baseUrl)
        .post(`/api/spaces/${space.id}/set-hidden-features`)
        .set('Cookie', userCookie)
        .send({
          hiddenFeatures: ['member_directory']
        } as Pick<SpaceHiddenFeatures, 'hiddenFeatures'>)
        .expect(200)
    ).body as Space;

    expect(updatedSpace.hiddenFeatures).toHaveLength(1);
    expect(updatedSpace.hiddenFeatures[0]).toBe('member_directory');
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const userCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl)
      .post(`/api/spaces/${space.id}/set-hidden-features`)
      .set('Cookie', userCookie)
      .send({
        hiddenFeatures: ['member_directory']
      } as Pick<SpaceHiddenFeatures, 'hiddenFeatures'>)
      .expect(401);
  });
});
