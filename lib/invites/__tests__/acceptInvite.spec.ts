import { InvalidInputError } from '@charmverse/core/errors';
import type { InviteLink, Role, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { acceptInvite } from '../acceptInvite';

let space: Space;
let adminUser: User;
let role: Role;
let inviteLink: InviteLink;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  space = generated.space;
  adminUser = generated.user;
  role = await testUtilsMembers.generateRole({
    createdBy: adminUser.id,
    spaceId: space.id
  });
  inviteLink = await testUtilsMembers.generateInviteLink({
    spaceId: space.id,
    createdBy: adminUser.id,
    assignedRoleIds: [role.id]
  });
});

describe('acceptInvite', () => {
  it('should enable a user to join a space', async () => {
    const outsideUser = await testUtilsUser.generateUser();

    // Explicit assertion this user is not a space member
    await expect(
      prisma.spaceRole.findFirst({ where: { userId: outsideUser.id, spaceId: space.id } })
    ).resolves.toBeNull();

    await acceptInvite({
      inviteLinkId: inviteLink.id,
      userId: outsideUser.id
    });

    const spaceRole = await prisma.spaceRole.findFirst({
      where: {
        userId: outsideUser.id,
        spaceId: space.id
      },
      include: {
        spaceRoleToRole: true
      }
    });

    expect(spaceRole).toBeDefined();
    expect(spaceRole?.spaceRoleToRole.length).toBe(1);
    expect(spaceRole?.spaceRoleToRole[0].roleId).toBe(role.id);
  });

  it('should not do anything if the user is already a member of the space', async () => {
    const spaceMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    await acceptInvite({
      inviteLinkId: inviteLink.id,
      userId: spaceMember.id
    });

    const spaceRole = await prisma.spaceRole.findFirst({
      where: {
        userId: spaceMember.id,
        spaceId: space.id
      },
      include: {
        spaceRoleToRole: true
      }
    });

    expect(spaceRole).toBeDefined();
    // No roles should hae been added
    expect(spaceRole?.spaceRoleToRole.length).toBe(0);
  });

  it('should throw an error if inviteLinkId or userId is invalid', async () => {
    await expect(
      acceptInvite({
        inviteLinkId: undefined as any,
        userId: v4()
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      acceptInvite({
        inviteLinkId: v4(),
        userId: undefined as any
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });
});
