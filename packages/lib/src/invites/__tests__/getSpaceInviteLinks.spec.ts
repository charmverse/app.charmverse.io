import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { getSpaceInviteLinks } from '../getSpaceInviteLinks';

describe('getSpaceInviteLinks', () => {
  it('should return all invite links for a space along with their roles if the user is an admin, and no private links for normal members', async () => {
    const { user: admin, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true
    });

    const member = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const exampleRole = await testUtilsMembers.generateRole({
      createdBy: admin.id,
      spaceId: space.id,
      roleName: 'example-role'
    });

    const spaceLinkWithRoles = await prisma.inviteLink.create({
      data: {
        code: v4(),
        author: { connect: { id: admin.id } },
        space: { connect: { id: space.id } },
        inviteLinkToRoles: {
          create: {
            roleId: exampleRole.id
          }
        }
      }
    });

    const proposalsLink = await prisma.inviteLink.create({
      data: {
        code: v4(),
        author: { connect: { id: admin.id } },
        space: { connect: { id: space.id } },
        visibleOn: 'proposals'
      }
    });

    // Data we should not get back
    const { user: secondUser, space: secondSpace } = await testUtilsUser.generateUserAndSpace({});

    const secondSpaceLink = await prisma.inviteLink.create({
      data: {
        code: v4(),
        author: { connect: { id: secondUser.id } },
        space: { connect: { id: secondSpace.id } },
        inviteLinkToRoles: {
          create: {
            roleId: exampleRole.id
          }
        }
      }
    });

    const adminVisibleLinks = await getSpaceInviteLinks({
      userId: admin.id,
      spaceId: space.id
    });

    expect(adminVisibleLinks.length).toBe(2);

    expect(adminVisibleLinks).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ ...spaceLinkWithRoles, roleIds: [exampleRole.id] }),
        expect.objectContaining({ ...proposalsLink, roleIds: [] })
      ])
    );

    const memberVisibleLinks = await getSpaceInviteLinks({
      userId: member.id,
      spaceId: space.id
    });

    expect(memberVisibleLinks.length).toBe(0);
  });

  it('should return proposal invite links to a normal member or external user if the space has activated public proposals', async () => {
    const { user: admin, space } = await testUtilsUser.generateUserAndSpace({
      isAdmin: true,
      publicProposals: true
    });

    const member = await testUtilsUser.generateSpaceUser({
      spaceId: space.id,
      isAdmin: false
    });

    const exampleRole = await testUtilsMembers.generateRole({
      createdBy: admin.id,
      spaceId: space.id,
      roleName: 'example-role'
    });

    const inviteLink = await prisma.inviteLink.create({
      data: {
        code: v4(),
        author: { connect: { id: admin.id } },
        space: { connect: { id: space.id } }
      }
    });

    const proposalsLink = await prisma.inviteLink.create({
      data: {
        code: v4(),
        author: { connect: { id: admin.id } },
        space: { connect: { id: space.id } },
        visibleOn: 'proposals',
        inviteLinkToRoles: {
          create: {
            roleId: exampleRole.id
          }
        }
      }
    });

    // Quick test of comparison data to make sure the test makes sense
    const memberVisibleLinks = await getSpaceInviteLinks({
      userId: member.id,
      spaceId: space.id
    });

    expect(memberVisibleLinks.length).toBe(1);

    expect(memberVisibleLinks).toEqual(expect.arrayContaining([{ ...proposalsLink, roleIds: [exampleRole.id] }]));

    const externalUserLinks = await getSpaceInviteLinks({
      userId: undefined,
      spaceId: space.id
    });

    expect(externalUserLinks.length).toBe(1);

    expect(externalUserLinks).toEqual(expect.arrayContaining([{ ...proposalsLink, roleIds: [exampleRole.id] }]));
  });

  it('should throw an error if spaceId is invalid', async () => {
    await expect(getSpaceInviteLinks({ userId: undefined, spaceId: undefined as any })).rejects.toBeInstanceOf(
      InvalidInputError
    );
    await expect(getSpaceInviteLinks({ userId: undefined, spaceId: 'not-a-uuid' })).rejects.toBeInstanceOf(
      InvalidInputError
    );
  });
});
