import type { Space, User } from '@charmverse/core/prisma';
import { prisma } from 'prisma-client';

import { generateInviteLink, generateRole } from '../members';
import { generateSpaceUser, generateUserAndSpace } from '../user';

describe('generateInviteLink', () => {
  it('should generate an invite link with specified roles', async () => {
    const { user, space } = await generateUserAndSpace({});

    const role = await generateRole({ createdBy: user.id, spaceId: space.id });

    const inviteLink = await generateInviteLink({
      createdBy: user.id,
      spaceId: space.id,
      maxAgeMinutes: 90,
      maxUses: 100,
      visibleOn: 'proposals',
      assignedRoleIds: [role.id]
    });

    expect(inviteLink).toMatchObject({
      createdBy: user.id,
      spaceId: space.id,
      maxAgeMinutes: 90,
      maxUses: 100,
      visibleOn: 'proposals'
    });

    expect(inviteLink.inviteLinkToRoles.length).toBe(1);
    expect(inviteLink.inviteLinkToRoles[0].roleId).toBe(role.id);
  });
});

describe('generateRole', () => {
  let space: Space;
  let adminUser: User;
  let spaceMember: User;

  beforeAll(async () => {
    const generated = await generateUserAndSpace();
    space = generated.space;
    adminUser = generated.user;
    spaceMember = await generateSpaceUser({
      spaceId: space.id
    });
  });
  it('should generate a role with optional assigned users', async () => {
    const role = await generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceMember.id]
    });

    const generatedRoleMemberships = await prisma.spaceRoleToRole.findMany({
      where: {
        roleId: role.id
      },
      select: {
        roleId: true,
        spaceRole: true
      }
    });

    expect(generatedRoleMemberships).toHaveLength(1);

    expect(generatedRoleMemberships[0].spaceRole.userId).toBe(spaceMember.id);
  });

  it('should create space-wide permissions for the role if provided', async () => {
    const role = await generateRole({
      createdBy: adminUser.id,
      spaceId: space.id,
      assigneeUserIds: [spaceMember.id],
      spacePermissions: ['deleteAnyProposal']
    });

    const spacePermission = await prisma.spacePermission.findUnique({
      where: {
        roleId_forSpaceId: {
          forSpaceId: space.id,
          roleId: role.id
        }
      }
    });

    expect(spacePermission?.roleId).toBe(role.id);
    expect(spacePermission?.operations).toEqual(['deleteAnyProposal']);
  });
});
