import type { InviteLink, Space, User } from '@charmverse/core/prisma';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import request from 'supertest';

import type { InviteLinkInput } from 'lib/invites/createInviteLink';
import type { InviteLinkWithRoles } from 'lib/invites/getSpaceInviteLinks';
import { baseUrl, loginUser } from 'testing/mockApiCall';

describe('POST /api/invites - Create an invite', () => {
  let space: Space;
  let adminUser: User;
  let nonAdminUser: User;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    space = generated.space;
    adminUser = generated.user;
    nonAdminUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
  });

  it('should create an invite if a user is an admin of the space, responding with 201', async () => {
    const adminCookie = await loginUser(adminUser.id);

    const input: Partial<InviteLinkInput> = {
      maxAgeMinutes: 60,
      maxUses: 10,
      spaceId: space.id
    };

    const invite = (await request(baseUrl).post(`/api/invites`).set('Cookie', adminCookie).send(input).expect(201))
      .body as InviteLink;

    expect(invite).toMatchObject(input);
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    const userCookie = await loginUser(nonAdminUser.id);

    const input: Partial<InviteLinkInput> = {
      maxAgeMinutes: 60,
      maxUses: 10,
      spaceId: space.id
    };

    await request(baseUrl).post(`/api/invites`).set('Cookie', userCookie).send(input).expect(401);
  });
});
describe('GET /api/invites - Get space invites', () => {
  let space: Space;
  let user: User;
  let outsideUser: User;
  let invite: InviteLink;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: false });
    space = generated.space;
    user = generated.user;
    outsideUser = await testUtilsUser.generateUser();
    invite = await testUtilsMembers.generateInviteLink({
      createdBy: user.id,
      spaceId: space.id
    });
  });

  it('should return all invites to space members, responding with 200', async () => {
    const userCookie = await loginUser(user.id);
    const invites = (
      await request(baseUrl).get(`/api/invites?spaceId=${space.id}`).set('Cookie', userCookie).expect(200)
    ).body as InviteLinkWithRoles[];

    expect(invites).toHaveLength(1);
    expect(invites[0]).toMatchObject<InviteLinkWithRoles>({
      ...invite,
      code: '', // code will be empty for non-admins
      createdAt: new Date(invite.createdAt).toISOString() as any,
      roleIds: []
    });
  });

  it('should fail if the user is not a member of the space, and respond 401', async () => {
    const outsideUserCookie = await loginUser(outsideUser.id);
    await request(baseUrl).get(`/api/invites?spaceId=${space.id}`).set('Cookie', outsideUserCookie).expect(401);
  });
});
