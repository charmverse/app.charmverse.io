/* eslint-disable camelcase */

import request from 'supertest';

import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { addSpaceSubscription } from 'testing/utils/spaces';
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

describe('POST /api/spaces/[id]/subscription - Create subscription for space', () => {
  it('should throw error if the user is not an admin and return 401', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken({}, false);
    const userCookie = await loginUser(user.id);

    await request(baseUrl)
      .post(`/api/spaces/${space.id}/subscription`)
      .set('Cookie', userCookie)
      .send({
        period: 'monthly',
        billingEmail: 'test@gmail.com',
        productId: 'community'
      })
      .expect(401);
  });

  it('should throw error if the space already has a subscription and return 400', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken({});
    const userCookie = await loginUser(user.id);

    await addSpaceSubscription({
      spaceId: space.id
    });

    await request(baseUrl)
      .post(`/api/spaces/${space.id}/subscription`)
      .set('Cookie', userCookie)
      .send({
        period: 'monthly',
        billingEmail: 'test@gmail.com',
        productId: 'community'
      })
      .expect(400);
  });
});
