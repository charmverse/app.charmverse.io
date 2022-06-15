/* eslint-disable @typescript-eslint/no-unused-vars */
import { SpacePermissionModification, SpacePermissionWithAssignee } from 'lib/permissions/spaces';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('POST /api/permissions/space/{spaceId}/add - Add space permissions', () => {

  it('should succeed if the user is a space admin, and respond 201', async () => {

    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    const spacePermissionContent: Omit<SpacePermissionModification, 'forSpaceId'> = {
      operations: ['createPage'],
      spaceId: space.id
    };

    const adminCookie = await loginUser(adminUser);

    const createdPermission = (await request(baseUrl)
      .post(`/api/permissions/space/${space.id}/add`)
      .set('Cookie', adminCookie)
      .send(spacePermissionContent)
      .expect(201)).body as SpacePermissionWithAssignee<'space'>;

    expect(createdPermission.forSpaceId).toBe(space.id);
    expect(createdPermission.operations.length).toBe(1);
    expect(createdPermission.operations[0]).toBe('createPage');
    expect(createdPermission.space.id).toBe(space.id);

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
