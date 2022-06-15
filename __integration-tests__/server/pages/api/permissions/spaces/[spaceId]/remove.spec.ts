/* eslint-disable @typescript-eslint/no-unused-vars */
import { addSpaceOperations, SpacePermissionModification, SpacePermissionWithAssignee } from 'lib/permissions/spaces';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('POST /api/permissions/space/{spaceId}/remove - Remove space permissions', () => {

  it('should succeed if the user is a space admin, and respond 201', async () => {

    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    const permissionActionContent: SpacePermissionModification = {
      forSpaceId: space.id,
      operations: ['createBounty'],
      spaceId: space.id
    };

    await addSpaceOperations(permissionActionContent);

    const adminCookie = await loginUser(adminUser);

    const { success } = (await request(baseUrl)
      .post(`/api/permissions/space/${space.id}/remove`)
      .set('Cookie', adminCookie)
      .send(permissionActionContent)
      .expect(200)).body as {success: boolean};

    expect(success).toBe(true);

  });

  it('should fail if the user is not a space admin, and respond 401', async () => {

    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const permissionActionContent: SpacePermissionModification = {
      forSpaceId: space.id,
      operations: ['createBounty'],
      spaceId: space.id
    };

    const nonAdminCookie = await loginUser(nonAdminUser);

    await request(baseUrl)
      .post(`/api/permissions/space/${space.id}/remove`)
      .set('Cookie', nonAdminCookie)
      .send(permissionActionContent)
      .expect(401);

  });

});
