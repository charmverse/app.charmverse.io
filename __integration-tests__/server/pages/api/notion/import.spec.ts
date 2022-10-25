/* eslint-disable @typescript-eslint/no-unused-vars */
import request from 'supertest';

import type { RoleAssignment, RoleWithMembers } from 'lib/roles';
import { assignRole } from 'lib/roles';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateRole, generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('POST /api/notion/import - Import from Notion', () => {

  it('should validate request params for space admin and respond 400', async () => {

    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    const sessionCookie = await loginUser(adminUser.id);

    await request(baseUrl)
      .post('/api/notion/import')
      .set('Cookie', sessionCookie)
      .expect(400);

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
