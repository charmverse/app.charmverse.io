/* eslint-disable @typescript-eslint/no-unused-vars */
import { testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

describe('POST /api/spaces/[id]/set-public-proposals - Make the space proposals public or private', () => {
  it('should fail for free tier spaces, responding with 402', async () => {
    const { space, user: adminUser } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      spacePaidTier: 'free'
    });

    const adminCookie = await loginUser(adminUser.id);

    await request(baseUrl)
      .post(`/api/spaces/${space.id}/set-public-proposals`)
      .set('Cookie', adminCookie)
      .send({
        publicProposals: false
      })
      .expect(402);
  });
});
