import { SpaceOperation } from '@charmverse/core/prisma';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import request from 'supertest';

import type { SpacePermissionFlags, SpacePermissionModification } from 'lib/permissions/spaces';
import { addSpaceOperations } from 'lib/permissions/spaces';

describe('GET /api/permissions/space/{spaceId}/compute - Compute user space permissions', () => {
  it('should return assigned permissions for the user and respond 200', async () => {
    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    await addSpaceOperations({
      forSpaceId: space.id,
      userId: nonAdminUser.id,
      operations: ['createBounty']
    });

    const adminCookie = await loginUser(nonAdminUser.id);

    const computedPermissions = (
      await request(baseUrl)
        .get(`/api/permissions/space/${space.id}/compute`)
        .set('Cookie', adminCookie)
        .send({})
        .expect(200)
    ).body as SpacePermissionFlags;

    expect(computedPermissions.createBounty).toBe(true);
    expect(computedPermissions.createPage).toBe(false);
  });

  it('should return full permissions for the admin user and respond 200', async () => {
    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    const adminCookie = await loginUser(adminUser.id);

    // No need to assign permissions
    const computedPermissions = (
      await request(baseUrl)
        .get(`/api/permissions/space/${space.id}/compute`)
        .set('Cookie', adminCookie)
        .send({})
        .expect(200)
    ).body as SpacePermissionFlags;

    (Object.keys(SpaceOperation) as SpaceOperation[]).forEach((op) => {
      expect(computedPermissions[op]).toBe(true);
    });
  });

  it('should return empty permissions if the user is not a space member, and respond 200', async () => {
    const { space } = await generateUserAndSpaceWithApiToken(undefined, false);

    const { user: userInOtherSpace } = await generateUserAndSpaceWithApiToken();

    const spacePermissionContent: Omit<SpacePermissionModification, 'forSpaceId'> = {
      operations: ['createPage'],
      spaceId: space.id
    };

    const nonMemberCookie = await loginUser(userInOtherSpace.id);

    const computedPermissions = (
      await request(baseUrl)
        .get(`/api/permissions/space/${space.id}/compute`)
        .set('Cookie', nonMemberCookie)
        .send({})
        .expect(200)
    ).body as SpacePermissionFlags;

    (Object.keys(SpaceOperation) as SpaceOperation[]).forEach((op) => {
      expect(computedPermissions[op]).toBe(false);
    });
  });
});
