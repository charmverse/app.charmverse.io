import { SpacePermissionFlags, SpacePermissionModification, SpacePermissionWithAssignee } from 'lib/permissions/spaces';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('POST /api/permissions/space/{spaceId}/add - Add space permissions', () => {

  it('should succeed if the user is a space admin, sending back available operations for target group and respond 201', async () => {

    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    const spacePermissionContent: Omit<SpacePermissionModification, 'forSpaceId'> = {
      operations: ['createPage'],
      spaceId: space.id
    };

    const adminCookie = await loginUser(adminUser);

    const updatedPermissions = (await request(baseUrl)
      .post(`/api/permissions/space/${space.id}/add`)
      .set('Cookie', adminCookie)
      .send(spacePermissionContent)
      .expect(201)).body as SpacePermissionFlags;

    expect(updatedPermissions.createPage).toBe(true);
    expect(updatedPermissions.createBounty).toBe(false);

  });

  it('should fail if the user is not a space admin, and respond 401', async () => {

    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const spacePermissionContent: Omit<SpacePermissionModification, 'forSpaceId'> = {
      operations: ['createPage'],
      spaceId: space.id
    };

    const nonAdminCookie = await loginUser(nonAdminUser);

    await request(baseUrl)
      .post(`/api/permissions/space/${space.id}/add`)
      .set('Cookie', nonAdminCookie)
      .send(spacePermissionContent)
      .expect(401);

  });

});
