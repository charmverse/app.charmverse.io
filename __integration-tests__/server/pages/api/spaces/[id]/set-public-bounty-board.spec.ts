/* eslint-disable @typescript-eslint/no-unused-vars */
import type { Space, User } from '@prisma/client';
import request from 'supertest';

import type { PublicBountyToggle } from 'lib/spaces/interfaces';
import type { LoggedInUser } from 'models';
import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpaceWithApiToken } from 'testing/setupDatabase';

let nonAdminUser: LoggedInUser;
let nonAdminUserCookie: string;
let adminUser: LoggedInUser;
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

  nonAdminUserCookie = await loginUser(nonAdminUser.id);
  adminUserCookie = await loginUser(adminUser.id);

});

describe('POST /api/spaces/[id]/set-public-bounty-board - Make the space bounty board public or private', () => {
  it('should update a space`s public bounty board status, set its mode to "custom" and return the space, responding with 200', async () => {

    const update: Pick<PublicBountyToggle, 'publicBountyBoard'> = {
      publicBountyBoard: true
    };

    let updatedSpace = (await request(baseUrl)
      .post(`/api/spaces/${space.id}/set-public-bounty-board`)
      .set('Cookie', adminUserCookie)
      .send(update)
      .expect(200)).body as Space;

    expect(updatedSpace.publicBountyBoard).toBe(true);

    // Public bounty board toggle may be set from bounties page or space permissions page when in custom mode.
    // This breaks any link with a permission preset (read-only, collaborative, public workspace), to ensure the preset description does not become misleading (as bounties public status may be different from permission preset)
    expect(updatedSpace.permissionConfigurationMode).toBe('custom');

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
