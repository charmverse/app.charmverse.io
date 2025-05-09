/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space } from '@charmverse/core/prisma';
import type { LoggedInUser } from '@packages/profile/getUser';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateUserAndSpaceWithApiToken } from '@packages/testing/setupDatabase';
import { generatePostCategory } from '@packages/testing/utils/forums';
import request from 'supertest';

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

describe('POST /api/spaces/[id]/set-default-post-category - Set default page permission level for a space', () => {
  it('should update the default post category if user is a space admin, responding with 200', async () => {
    const postCategory = await generatePostCategory({
      name: `Test Category`,
      spaceId: adminUserSpace.id
    });

    const updatedSpace = (
      await request(baseUrl)
        .post(`/api/spaces/${adminUserSpace.id}/set-default-post-category`)
        .set('Cookie', adminCookie)
        .send({
          postCategoryId: postCategory.id
        })
        .expect(200)
    ).body as Space;
    expect(updatedSpace.defaultPostCategoryId).toBe(postCategory.id);
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    const postCategory = await generatePostCategory({
      name: `Test Category 2`,
      spaceId: nonAdminUserSpace.id
    });

    await request(baseUrl)
      .post(`/api/spaces/${nonAdminUserSpace.id}/set-default-post-category`)
      .set('Cookie', nonAdminCookie)
      .send({
        postCategoryId: postCategory.id
      })
      .expect(401);
  });

  it('should fail if the user is not a member of the space, and respond 401', async () => {
    const postCategory = await generatePostCategory({
      name: `Test Category 3`,
      spaceId: nonAdminUserSpace.id
    });

    await request(baseUrl)
      .post(`/api/spaces/${nonAdminUserSpace.id}/set-default-post-category`)
      .set('Cookie', adminCookie)
      .send({
        postCategoryId: postCategory.id
      })
      .expect(401);
  });
});
