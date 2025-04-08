import type { Space, User } from '@charmverse/core/prisma';
import type { LoggedInUser } from '@root/lib/profile/getUser';
import { getSnapshotSpace } from '@root/lib/snapshot/getSpace';
import request from 'supertest';

import { baseUrl, loginUser } from 'testing/mockApiCall';
import { generateSpaceUser, generateUserAndSpace } from 'testing/setupDatabase';

const mockedGetSnapshotSpace = getSnapshotSpace as jest.MockedFunction<typeof getSnapshotSpace>;

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

xdescribe('PUT /api/spaces/[id]/snapshot - Update snapshot connection', () => {
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
