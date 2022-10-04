import request from 'supertest';

import { updateSpacePermissionConfigurationMode } from 'lib/permissions/meta';
import type { SpacePermissionFlags, SpacePermissionModification } from 'lib/permissions/spaces';
import { addSpaceOperations } from 'lib/permissions/spaces';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateRole, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('POST /api/permissions/space/{spaceId}/remove - Remove space permissions', () => {

  it('should succeed if the user is a space admin, sending back available operations for target group and respond 200', async () => {

    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    await addSpaceOperations({
      forSpaceId: space.id,
      operations: ['createBounty', 'createPage'],
      spaceId: space.id
    });

    const adminCookie = await loginUser(adminUser.id);

    const toRemove: SpacePermissionModification = {
      forSpaceId: space.id,
      operations: ['createPage'],
      spaceId: space.id
    };

    const updatedPermissions = (await request(baseUrl)
      .post(`/api/permissions/space/${space.id}/remove`)
      .set('Cookie', adminCookie)
      .send(toRemove)
      .expect(200)).body as SpacePermissionFlags;

    expect(updatedPermissions.createBounty).toBe(true);
    expect(updatedPermissions.createPage).toBe(false);

  });

  it('should succeed if the user is admin trying to remove role-level permissions, and the space permission mode is not "custom", and respond 200', async () => {

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
      .post(`/api/permissions/space/${space.id}/remove`)
      .set('Cookie', nonAdminCookie)
      .send(spacePermissionContent)
      .expect(200);

  });

  it('should succeed if the user is admin trying to remove user-level permissions, and the space permission mode is not "custom", and respond 200', async () => {

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
      .post(`/api/permissions/space/${space.id}/remove`)
      .set('Cookie', nonAdminCookie)
      .send(spacePermissionContent)
      .expect(200);

  });

  it('should fail if the user is not a space admin, and respond 401', async () => {

    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const permissionActionContent: SpacePermissionModification = {
      forSpaceId: space.id,
      operations: ['createBounty'],
      spaceId: space.id
    };

    const nonAdminCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl)
      .post(`/api/permissions/space/${space.id}/remove`)
      .set('Cookie', nonAdminCookie)
      .send(permissionActionContent)
      .expect(401);

  });

  it('should fail if the user is admin, but the space permission mode is not "custom", and respond 401', async () => {

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
      .post(`/api/permissions/space/${space.id}/remove`)
      .set('Cookie', nonAdminCookie)
      .send(spacePermissionContent)
      .expect(401);

  });

});
