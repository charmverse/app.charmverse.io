import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import request from 'supertest';

import type { SpacePermissionModification } from '@packages/lib/permissions/spaces';
import { computeGroupSpacePermissions } from '@packages/lib/permissions/spaces/computeGroupSpacePermissions';
import type { SpacePermissions } from '@packages/lib/permissions/spaces/listPermissions';

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
            moderateForums: false,
            deleteAnyBounty: false,
            deleteAnyPage: false,
            deleteAnyProposal: false,
            createProposals: false
          },
          assignee: {
            id: space.id,
            group: 'space'
          }
        }
      ],
      forumCategories: []
    };

    const adminCookie = await loginUser(adminUser.id);

    await request(baseUrl)
      .post(`/api/permissions/space/${space.id}/settings`)
      .set('Cookie', adminCookie)
      .send(spacePermissionContent)
      .expect(200);

    const updatedPermissions = await computeGroupSpacePermissions({
      id: space.id,
      group: 'space',
      resourceId: space.id
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
