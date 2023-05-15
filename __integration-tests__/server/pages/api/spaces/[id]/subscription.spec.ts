/* eslint-disable camelcase */

import request from 'supertest';

import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { generateUser } from 'testing/utils/users';

describe('GET /api/spaces/[id]/subscription - Get subscription for a space', () => {
  it('should throw error if the user is not member of the space and return 401', async () => {
    const { space } = await generateUserAndSpaceWithApiToken({}, false);
    const user = await generateUser();
    const userCookie = await loginUser(user.id);

    await request(baseUrl).get(`/api/spaces/${space.id}/subscription`).set('Cookie', userCookie).expect(401);
  });

  it("should return null if the space isn't subscribed and return 200", async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken({});
    const userCookie = await loginUser(user.id);

    const response = (
      await request(baseUrl).get(`/api/spaces/${space.id}/subscription`).set('Cookie', userCookie).expect(200)
    ).body;
    expect(response).toBeNull();
  });
});
