import request from 'supertest';

import { computeSpacePermissions } from 'lib/permissions/computeSpacePermissions';
import type { SpacePermissionFlags, SpacePermissionModification } from 'lib/permissions/spaces';
import type { SpacePermissions } from 'lib/permissions/spaces/listPermissions';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

describe('POST /api/permissions/space/{spaceId}/settings - Saving space permissions', () => {
  it('should succeed if the user is a space admin and respond 200', async () => {
    const { space, user: adminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    const spacePermissionContent: SpacePermissions = {
      space: [
        {
          operations: {
            createPage: true,
            createBounty: false,
            reviewProposals: false,
            createForumCategory: false,
            moderateForums: false
          },
          assignee: {
            id: space.id,
            group: 'space'
          }
        }
      ],
      proposalCategories: [],
      forumCategories: []
    };

    const adminCookie = await loginUser(adminUser.id);

    await request(baseUrl)
      .post(`/api/permissions/space/${space.id}/settings`)
      .set('Cookie', adminCookie)
      .send(spacePermissionContent)
      .expect(200);

    const updatedPermissions = await computeSpacePermissions({
      forSpaceId: space.id,
      group: 'space',
      spaceId: space.id
    });
    expect(updatedPermissions.createPage).toBe(true);
    expect(updatedPermissions.createBounty).toBe(false);
  });

  it('should fail if the user is not a space admin, and respond 401', async () => {
    const { space, user: nonAdminUser } = await generateUserAndSpaceWithApiToken(undefined, false);

    const spacePermissionContent: Omit<SpacePermissionModification, 'forSpaceId'> = {
      operations: ['createPage'],
      spaceId: space.id
    };

    const nonAdminCookie = await loginUser(nonAdminUser.id);

    await request(baseUrl)
      .post(`/api/permissions/space/${space.id}/settings`)
      .set('Cookie', nonAdminCookie)
      .send(spacePermissionContent)
      .expect(401);
  });
});
