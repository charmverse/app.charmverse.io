import type { InviteLink, Role, Space, User } from '@charmverse/core/prisma';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { baseUrl, loginUser } from '@packages/testing/mockApiCall';
import request from 'supertest';

describe('PUT /api/invites/roles - Assign roles to an invite in a free space', () => {
  let space: Space;
  let adminUser: User;
  let role: Role;
  let invite: InviteLink;

  beforeAll(async () => {
    const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true, spacePaidTier: 'free' });
    space = generated.space;
    adminUser = generated.user;
    role = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id
    });
    invite = await testUtilsMembers.generateInviteLink({
      createdBy: adminUser.id,
      spaceId: space.id
    });
  });

  it('should fail to assign roles for a free space, responding with 402', async () => {
    const adminCookie = await loginUser(adminUser.id);

    const input = {
      roleIds: [role.id],
      spaceId: space.id
    };

    await request(baseUrl).put(`/api/invites/${invite.id}/roles`).set('Cookie', adminCookie).send(input).expect(402);
  });
});
