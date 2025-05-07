/* eslint-disable @typescript-eslint/no-unused-vars */

import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import request from 'supertest';

describe('POST /api/notion/import - Import from Notion', () => {
  it('should validate request params for space admin and respond 200', async () => {
    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    const sessionCookie = await loginUser(adminUser.id);

    const response = await request(baseUrl)
      .post('/api/notion/import')
      .set('Cookie', sessionCookie)
      .send({ code: 'code', spaceId: space.id })
      .expect(200);

    expect(response.body).toStrictEqual({ failedImports: [] });
  });

  it('should fail if the requesting user is not a space admin and respond 401', async () => {
    const { space, user } = await generateUserAndSpaceWithApiToken(undefined, false);

    const sessionCookie = await loginUser(user.id);

    await request(baseUrl)
      .post('/api/notion/import')
      .set('Cookie', sessionCookie)
      .send({ code: 'code', spaceId: space.id })
      .expect(401);
  });
});
