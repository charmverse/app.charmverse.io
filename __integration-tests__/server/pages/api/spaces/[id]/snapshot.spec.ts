import type { Space } from '@charmverse/core/prisma';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import request from 'supertest';

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

describe('PUT /api/spaces/[id]/snapshot - Update snapshot connection', () => {
  it("should update a space's snapshot connection if the user is a space admin, responding with 200", async () => {
    const update = {
      snapshotDomain: 'aave.eth'
    };

    const updatedSpace = (
      await request(baseUrl)
        .put(`/api/spaces/${space.id}/snapshot`)
        .set('Cookie', adminUserCookie)
        .send(update)
        .expect(200)
    ).body as Space;

    expect(updatedSpace.snapshotDomain).toBe(update.snapshotDomain);
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    const update = {
      snapshotDomain: 'aave.eth'
    };

    await request(baseUrl)
      .put(`/api/spaces/${space.id}/snapshot`)
      .set('Cookie', nonAdminUserCookie)
      .send(update)
      .expect(401);
  });

  it('should fail if the domain does not exist, and respond 404', async () => {
    const update = {
      snapshotDomain: 'completely-inexistent-domain.abc'
    };

    await request(baseUrl)
      .put(`/api/spaces/${space.id}/snapshot`)
      .set('Cookie', adminUserCookie)
      .send(update)
      .expect(404);
  });
});
