import type { Role, Space, User } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { DataNotFoundError, InsecureOperationError, InvalidInputError } from '@packages/core/errors';
import { v4 } from 'uuid';

import { updateInviteLinkRoles } from '../updateInviteLinkRoles';

let space: Space;
let user: User;
let role: Role;

beforeAll(async () => {
  const generated = await testUtilsUser.generateUserAndSpace();
  space = generated.space;
  user = generated.user;
  role = await testUtilsMembers.generateRole({
    spaceId: space.id,
    createdBy: user.id
  });
});
describe('updateInviteLinkRoles', () => {
  it('should set the linked roles for the invite', async () => {
    const invite = await testUtilsMembers.generateInviteLink({
      createdBy: user.id,
      spaceId: space.id,
      assignedRoleIds: [role.id]
    });

    const newRole = await testUtilsMembers.generateRole({
      spaceId: space.id,
      createdBy: user.id
    });

    const updatedInvite = await updateInviteLinkRoles({
      inviteLinkId: invite.id,
      roleIds: [newRole.id]
    });

    expect(updatedInvite.roleIds).toHaveLength(1);
    expect(updatedInvite.roleIds).toEqual([newRole.id]);

    const linkToRolesInDatabase = await prisma.inviteLinkToRole.findMany({
      where: {
        inviteLinkId: invite.id
      }
    });
    expect(linkToRolesInDatabase).toHaveLength(1);
    expect(linkToRolesInDatabase[0].roleId).toEqual(newRole.id);
  });

  it('should throw an error if assigning roles outside the space', async () => {
    const invite = await testUtilsMembers.generateInviteLink({
      createdBy: user.id,
      spaceId: space.id,
      assignedRoleIds: [role.id]
    });

    const { space: outsideSpace, user: outsideUser } = await testUtilsUser.generateUserAndSpace();
    const outsideRole = await testUtilsMembers.generateRole({
      createdBy: outsideUser.id,
      spaceId: outsideSpace.id
    });

    await expect(
      updateInviteLinkRoles({
        inviteLinkId: invite.id,
        roleIds: [outsideRole.id]
      })
    ).rejects.toBeInstanceOf(InsecureOperationError);

    // Make sure the link was not updated
    const linkInDb = await prisma.inviteLink.findUnique({
      where: {
        id: invite.id
      },
      include: {
        inviteLinkToRoles: true
      }
    });

    expect(linkInDb?.inviteLinkToRoles).toHaveLength(1);
    expect(linkInDb?.inviteLinkToRoles[0].roleId).toEqual(role.id);
  });

  it('should throw an error if inviteLinkId or roleIds are invalid', async () => {
    await expect(
      updateInviteLinkRoles({
        inviteLinkId: undefined as any,
        roleIds: []
      })
    ).rejects.toBeInstanceOf(InvalidInputError);

    await expect(
      updateInviteLinkRoles({
        inviteLinkId: v4(),
        roleIds: undefined as any
      })
    ).rejects.toBeInstanceOf(InvalidInputError);
  });

  it('should throw an error if invite link does not exist', async () => {
    await expect(
      updateInviteLinkRoles({
        inviteLinkId: v4(),
        roleIds: []
      })
    ).rejects.toBeInstanceOf(DataNotFoundError);
  });
});
