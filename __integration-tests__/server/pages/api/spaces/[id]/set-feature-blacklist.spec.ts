/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space } from '@prisma/client';
import request from 'supertest';

import type { SpaceFeatureBlacklist } from 'lib/spaces/setFeatureBlacklist';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('POST /api/spaces/[id]/set-feature-blacklist - Set feature blacklist for the space', () => {
  it('should update the feature blacklist if user is admin, and return the space, responding with 200', async () => {
    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    const userCookie = await loginUser(adminUser.id);

    const updatedSpace = (
      await request(baseUrl)
        .post(`/api/spaces/${space.id}/set-feature-blacklist`)
        .set('Cookie', userCookie)
        .send({
          featureBlacklist: ['member_directory']
        } as Pick<SpaceFeatureBlacklist, 'featureBlacklist'>)
        .expect(200)
    ).body as Space;

    expect(updatedSpace.featureBlacklist).toHaveLength(1);
    expect(updatedSpace.featureBlacklist[0]).toBe('member_directory');
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const userCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl)
      .post(`/api/spaces/${space.id}/set-feature-blacklist`)
      .set('Cookie', userCookie)
      .send({
        featureBlacklist: ['member_directory']
      } as Pick<SpaceFeatureBlacklist, 'featureBlacklist'>)
      .expect(401);
  });
});
