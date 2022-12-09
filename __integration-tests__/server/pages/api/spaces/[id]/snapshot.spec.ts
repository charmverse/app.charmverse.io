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

describe('PUT /api/spaces/[id]/snapshot - Update snapshot connection', () => {
  it("should update a space's snapshot connection if the user is a space admin, responding with 200", async () => {
    const update: Pick<Space, 'snapshotDomain' | 'defaultVotingDuration'> = {
      snapshotDomain: 'aave.eth',
      defaultVotingDuration: 12
    };

    const updatedSpace = (
      await request(baseUrl)
        .put(`/api/spaces/${space.id}/snapshot`)
        .set('Cookie', adminUserCookie)
        .send(update)
        .expect(200)
    ).body as Space;

    expect(updatedSpace.snapshotDomain).toBe(update.snapshotDomain);
    expect(updatedSpace.defaultVotingDuration).toBe(update.defaultVotingDuration);
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    const update: Pick<Space, 'snapshotDomain' | 'defaultVotingDuration'> = {
      snapshotDomain: 'aave.eth',
      defaultVotingDuration: 12
    };

    await request(baseUrl)
      .put(`/api/spaces/${space.id}/snapshot`)
      .set('Cookie', nonAdminUserCookie)
      .send(update)
      .expect(401);
  });

  it('should fail if the domain does not exist, and respond 404', async () => {
    const update: Pick<Space, 'snapshotDomain' | 'defaultVotingDuration'> = {
      snapshotDomain: 'completely-inexistent-domain.abc',
      defaultVotingDuration: 12
    };

    await request(baseUrl)
      .put(`/api/spaces/${space.id}/snapshot`)
      .set('Cookie', adminUserCookie)
      .send(update)
      .expect(404);
  });
});
