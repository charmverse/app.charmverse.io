import type { Space, User } from '@charmverse/core/prisma';
import { getSnapshotSpace } from '@packages/lib/snapshot/getSpace';
import type { LoggedInUser } from '@packages/profile/getUser';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpace } from '@packages/testing/setupDatabase';
import request from 'supertest';
import type { MockedFunction } from 'vitest';

const mockedGetSnapshotSpace = getSnapshotSpace as MockedFunction<typeof getSnapshotSpace>;

let nonAdminUser: User;
let nonAdminUserCookie: string;
let adminUser: LoggedInUser;
let adminUserCookie: string;
let space: Space;

beforeAll(async () => {
  const { space: generatedSpace, user } = await generateUserAndSpace();

  space = generatedSpace;
  nonAdminUser = user;
  adminUser = await generateSpaceUser({
    isAdmin: true,
    spaceId: space.id
  });

  nonAdminUserCookie = await loginUser(nonAdminUser.id);
  adminUserCookie = await loginUser(adminUser.id);
});

beforeEach(() => {
  // Reset mock before each test
  mockedGetSnapshotSpace.mockReset();
});

describe.skip('PUT /api/spaces/[id]/snapshot - Update snapshot connection', () => {
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
    expect(mockedGetSnapshotSpace).toHaveBeenCalledWith('aave.eth');
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

    // Verify the mock was not called since auth should fail first
    expect(mockedGetSnapshotSpace).not.toHaveBeenCalled();
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

    expect(mockedGetSnapshotSpace).toHaveBeenCalledWith('completely-inexistent-domain.abc');
  });
});
