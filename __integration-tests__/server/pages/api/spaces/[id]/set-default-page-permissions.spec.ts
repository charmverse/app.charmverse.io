/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@prisma/client';
import request from 'supertest';

import { updateSpacePermissionConfigurationMode } from 'lib/permissions/meta';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let nonAdminUser: LoggedInUser;
let nonAdminUserSpace: Space;
let nonAdminCookie: string;

let adminUser: LoggedInUser;
let adminUserSpace: Space;
let adminCookie: string;

beforeAll(async () => {
  const generated1 = await generateUserAndSpaceWithApiToken(undefined, false);
  nonAdminUser = generated1.user;
  nonAdminUserSpace = generated1.space;
  nonAdminCookie = await loginUser(nonAdminUser.id);

  const generated2 = await generateUserAndSpaceWithApiToken(undefined, true);
  adminUser = generated2.user;
  adminUserSpace = generated2.space;
  adminCookie = await loginUser(adminUser.id);
});

describe('POST /api/spaces/[id]/set-default-page-permissions - Set default page permission level for a space', () => {
  it('should retrieve updated space with updated defaultPagePermissionGroup', async () => {
    const updatedSpace = (await request(baseUrl)
      .post(`/api/spaces/${adminUserSpace.id}/set-default-page-permissions`)
      .set('Cookie', adminCookie)
      .send({
        pagePermissionLevel: 'view_comment'
      })
      .expect(200)).body as Space;
    expect(updatedSpace.defaultPagePermissionGroup).toBe('view_comment');
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    await request(baseUrl)
      .post(`/api/spaces/${nonAdminUserSpace.id}/set-default-page-permissions`)
      .set('Cookie', nonAdminCookie)
      .send({
        pagePermissionLevel: 'full_access'
      })
      .expect(401);
  });

  it('should fail if the user is admin, but the space permission mode is not "custom", and respond 401', async () => {

    const { space: extraSpace, user: extraAdminUser } = await generateUserAndSpaceWithApiToken(undefined, true);

    await updateSpacePermissionConfigurationMode({
      spaceId: extraSpace.id,
      permissionConfigurationMode: 'collaborative'
    });

    const userCookie = await loginUser(extraAdminUser.id);

    await request(baseUrl)
      .post(`/api/spaces/${extraSpace.id}/set-default-page-permissions`)
      .set('Cookie', userCookie)
      .send({
        pagePermissionLevel: 'full_access'
      })
      .expect(401);
  });
});
