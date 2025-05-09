import { InvalidInputError, UnauthorisedActionError } from '@charmverse/core/errors';
import type { InviteLink, Role, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { acceptInvite } from '../acceptInvite';

let space: Space;
let adminUser: User;
let role: Role;
let inviteLinkWithRole: InviteLink;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace({ isAdmin: true });
  space = generated.space;
  adminUser = generated.user;
  role = await testUtilsMembers.generateRole({
    createdBy: adminUser.id,
    spaceId: space.id
  });
  inviteLinkWithRole = await testUtilsMembers.generateInviteLink({
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
      inviteLinkId: inviteLinkWithRole.id,
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

  it('should assign new roles to existing members of the space', async () => {
    const spaceMember = await testUtilsUser.generateSpaceUser({ spaceId: space.id });

    const newSpaceAdmin = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isAdmin: true });

    await acceptInvite({
      inviteLinkId: inviteLinkWithRole.id,
      userId: spaceMember.id
    });

    // This is here a second time to ensure the operation is idempotent and doesn't throw an error
    await acceptInvite({
      inviteLinkId: inviteLinkWithRole.id,
      userId: spaceMember.id
    });

    await acceptInvite({
      inviteLinkId: inviteLinkWithRole.id,
      userId: newSpaceAdmin.id
    });

    const memberSpaceRole = await prisma.spaceRole.findFirst({
      where: {
        userId: spaceMember.id,
        spaceId: space.id
      },
      include: {
        spaceRoleToRole: true
      }
    });

    const newAdminSpaceRole = await prisma.spaceRole.findFirst({
      where: {
        userId: newSpaceAdmin.id,
        spaceId: space.id
      },
      include: {
        spaceRoleToRole: true
      }
    });

    expect(memberSpaceRole).toBeDefined();
    // No roles should hae been added
    expect(memberSpaceRole?.spaceRoleToRole.length).toBe(1);

    expect(newAdminSpaceRole).toBeDefined();
    // No roles should hae been added
    expect(newAdminSpaceRole?.spaceRoleToRole.length).toBe(1);
  });

  it('should allow a guest user to become a member with attached roles the first time it is used', async () => {
    const guest = await testUtilsUser.generateSpaceUser({ spaceId: space.id, isGuest: true });

    await acceptInvite({
      inviteLinkId: inviteLinkWithRole.id,
      userId: guest.id
    });

    const spaceRole = await prisma.spaceRole.findUniqueOrThrow({
      where: {
        spaceUser: {
          spaceId: space.id,
          userId: guest.id
        }
      },
      include: {
        spaceRoleToRole: true
      }
    });

    expect(spaceRole?.isGuest).toBe(false);

    expect(spaceRole?.spaceRoleToRole).toHaveLength(1);
    expect(spaceRole?.spaceRoleToRole[0].roleId).toBe(role.id);

    const otherRole = await testUtilsMembers.generateRole({
      createdBy: adminUser.id,
      spaceId: space.id
    });

    const newInviteLink = await testUtilsMembers.generateInviteLink({
      createdBy: adminUser.id,
      spaceId: space.id,
      assignedRoleIds: [otherRole.id]
    });

    // Second round of invite accept now user is a member
    await acceptInvite({
      inviteLinkId: newInviteLink.id,
      userId: guest.id
    });

    const spaceRoleAfterSecondAccept = await prisma.spaceRole.findUnique({
      where: {
        spaceUser: {
          spaceId: space.id,
          userId: guest.id
        }
      },
      include: {
        spaceRoleToRole: true
      }
    });

    expect(spaceRoleAfterSecondAccept).toMatchObject({
      ...spaceRole,
      spaceRoleToRole: expect.arrayContaining([
        { ...spaceRole.spaceRoleToRole[0] },
        expect.objectContaining({ roleId: otherRole.id })
      ])
    });
  });

  it('should throw an error if the invite link has expired or exceeded its use count', async () => {
    const outsideUser = await testUtilsUser.generateUser();

    const linkWithUsageExceeded = await testUtilsMembers.generateInviteLink({
      createdBy: adminUser.id,
      spaceId: space.id,
      maxUses: 1,
      useCount: 1
    });

    await expect(
      acceptInvite({
        inviteLinkId: linkWithUsageExceeded.id,
        userId: outsideUser.id
      })
    ).rejects.toBeInstanceOf(UnauthorisedActionError);

    const expiredLink = await testUtilsMembers.generateInviteLink({
      createdBy: adminUser.id,
      createdAt: new Date(Date.now() - 1000 * 60 * 5),
      spaceId: space.id,
      maxUses: 1,
      useCount: 0,
      maxAgeMinutes: 1
    });

    // Todo - figure out how to mock dates
    await expect(
      acceptInvite({
        inviteLinkId: expiredLink.id,
        userId: outsideUser.id
      })
    ).rejects.toBeInstanceOf(UnauthorisedActionError);
  });

  it('should throw an error if a proposals invite link is valid, but the space does not have public proposals enabled', async () => {
    const { space: spaceWithPublicProposalsDisabled, user: spaceAdmin } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      publicProposals: false
    });

    const outsideUser = await testUtilsUser.generateUser();

    const linkWithUsageExceeded = await testUtilsMembers.generateInviteLink({
      createdBy: spaceAdmin.id,
      spaceId: spaceWithPublicProposalsDisabled.id,
      maxUses: 10,
      useCount: 1,
      visibleOn: 'proposals'
    });

    await expect(
      acceptInvite({
        inviteLinkId: linkWithUsageExceeded.id,
        userId: outsideUser.id
      })
    ).rejects.toBeInstanceOf(UnauthorisedActionError);
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
