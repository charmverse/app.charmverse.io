import type { InviteLink, Role, Space, User } from '@charmverse/core/prisma';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

import type { InviteLinkWithRoles } from 'lib/invites/getSpaceInviteLinks';

describe('PUT /api/invites/roles - Assign roles to an invite', () => {
  let space: Space;
  let adminUser: User;
  let nonAdminUser: User;
  let role: Role;
  let invite: InviteLink;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
    space = generated.space;
    adminUser = generated.user;
    nonAdminUser = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: false });
    role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id
    });
    invite = await testUtilsMembers.generateInviteLink({
      createdBy: adminUser.id,
      spaceId: space.id
    });
  });

  it('should assign roles to an invite if a user is an admin of the space, responding with 200', async () => {
    const adminCookie = await loginUser(adminUser.id);

    const input = {
      roleIds: [role.id],
      spaceId: space.id
    };

    const updatedInvite = (
      await request(baseUrl).put(`/api/invites/${invite.id}/roles`).set('Cookie', adminCookie).send(input).expect(200)
    ).body as InviteLinkWithRoles;

    expect(updatedInvite).toMatchObject({
      ...input,
      roleIds: [role.id]
    });
  });

  it('should fail if the user is not an admin of the space, and respond 401', async () => {
    const userCookie = await loginUser(nonAdminUser.id);

    const input = {
      roleIds: [role.id],
      spaceId: space.id
    };
    await request(baseUrl).put(`/api/invites/${invite.id}/roles`).set('Cookie', userCookie).send(input).expect(401);
  });
});
