/* eslint-disable @typescript-eslint/no-unused-vars */
import { Space, User } from '@prisma/client';
import request from 'supertest';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';
import { SpacePermissionConfigurationUpdate } from 'lib/permissions/meta';
import { PublicBountyToggle } from 'lib/spaces/interfaces';

let nonAdminUser: User;
let nonAdminUserCookie: string;
let adminUser: User;
let adminUserCookie: string;
let space: Space;

beforeAll(async () => {
  const { space: generatedSpace, user } = await generateUserAndSpaceWithApiToken(undefined, false);

  space = generatedSpace;
  nonAdminUser = user;
  adminUser = await generateSpaceUser({
    isAdmin: true,
    spaceId: space.id
  });

  nonAdminUserCookie = await loginUser(nonAdminUser);
  adminUserCookie = await loginUser(adminUser);

});

describe('POST /api/spaces/[id]/set-public-bounty-board - Make the space bounty board public or private', () => {
  it('should update the public bounty board status and return the space, responding with 200', async () => {

    const update: Pick<PublicBountyToggle, 'publicBountyBoard'> = {
      publicBountyBoard: true
    };

    let updatedSpace = (await request(baseUrl)
      .post(`/api/spaces/${space.id}/set-public-bounty-board`)
      .set('Cookie', adminUserCookie)
      .send(update)
      .expect(200)).body as Space;

    expect(updatedSpace.publicBountyBoard).toBe(true);

    // Make a second request to ensure the value is actually being changed
    update.publicBountyBoard = false;

    updatedSpace = (await request(baseUrl)
      .post(`/api/spaces/${space.id}/set-public-bounty-board`)
      .set('Cookie', adminUserCookie)
      .send(update)
      .expect(200)).body as Space;

    expect(updatedSpace.publicBountyBoard).toBe(false);
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {

    await request(baseUrl)
      .post(`/api/spaces/${space.id}/set-public-bounty-board`)
      .set('Cookie', nonAdminUserCookie)
      .send({
        defaultPublicPage: true
      })
      .expect(401);

  });
});
