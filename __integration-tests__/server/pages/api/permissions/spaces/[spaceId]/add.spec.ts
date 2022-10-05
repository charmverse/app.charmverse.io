import request from 'supertest';

import { updateSpacePermissionConfigurationMode } from 'lib/permissions/meta';
import type { SpacePermissionFlags, SpacePermissionModification } from 'lib/permissions/spaces';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('POST /api/permissions/space/{spaceId}/add - Add space permissions', () => {

  it('should succeed if the user is a space admin, sending back available operations for target group and respond 201', async () => {

    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    const spacePermissionContent: Omit<SpacePermissionModification, 'forSpaceId'> = {
      operations: ['createPage'],
      spaceId: space.id
    };

    const adminCookie = await loginUser(adminUser.id);

    const updatedPermissions = (await request(baseUrl)
      .post(`/api/permissions/space/${space.id}/add`)
      .set('Cookie', adminCookie)
      .send(spacePermissionContent)
      .expect(201)).body as SpacePermissionFlags;

    expect(updatedPermissions.createPage).toBe(true);
    expect(updatedPermissions.createBounty).toBe(false);

  });

  it('should succeed if the user is admin trying to assign role-level permissions, and the space permission mode is not "custom", and respond 201', async () => {

    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    await updateSpacePermissionConfigurationMode({
      spaceId: space.id,
      permissionConfigurationMode: 'collaborative'
    });

    const role = await generateRole({
      spaceId: space.id,
      createdBy: adminUser.id
    });

    const spacePermissionContent: Omit<SpacePermissionModification, 'forSpaceId'> = {
      operations: ['createPage'],
      roleId: role.id
    };

    const nonAdminCookie = await loginUser(adminUser.id);

    await request(baseUrl)
      .post(`/api/permissions/space/${space.id}/add`)
      .set('Cookie', nonAdminCookie)
      .send(spacePermissionContent)
      .expect(201);

  });

  it('should succeed if the user is admin trying to assign user-level permissions, and the space permission mode is not "custom", and respond 201', async () => {

    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    await updateSpacePermissionConfigurationMode({
      spaceId: space.id,
      permissionConfigurationMode: 'collaborative'
    });

    const spacePermissionContent: Omit<SpacePermissionModification, 'forSpaceId'> = {
      operations: ['createPage'],
      userId: adminUser.id
    };

    const nonAdminCookie = await loginUser(adminUser.id);

    await request(baseUrl)
      .post(`/api/permissions/space/${space.id}/add`)
      .set('Cookie', nonAdminCookie)
      .send(spacePermissionContent)
      .expect(201);

  });

  it('should fail if the user is not a space admin, and respond 401', async () => {

    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const spacePermissionContent: Omit<SpacePermissionModification, 'forSpaceId'> = {
      operations: ['createPage'],
      spaceId: space.id
    };

    const nonAdminCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl)
      .post(`/api/permissions/space/${space.id}/add`)
      .set('Cookie', nonAdminCookie)
      .send(spacePermissionContent)
      .expect(401);

  });

  it('should fail if the user is admin trying to assign space-level permissions, but the space permission mode is not "custom", and respond 401', async () => {

    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    await updateSpacePermissionConfigurationMode({
      spaceId: space.id,
      permissionConfigurationMode: 'collaborative'
    });

    const spacePermissionContent: Omit<SpacePermissionModification, 'forSpaceId'> = {
      operations: ['createPage'],
      spaceId: space.id
    };

    const nonAdminCookie = await loginUser(adminUser.id);

    await request(baseUrl)
      .post(`/api/permissions/space/${space.id}/add`)
      .set('Cookie', nonAdminCookie)
      .send(spacePermissionContent)
      .expect(401);

  });

});
