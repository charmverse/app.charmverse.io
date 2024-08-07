import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { testUtilsMembers, testUtilsUser } from '@charmverse/core/test';
import { v4 } from 'uuid';

import { getSpaceInviteLinks } from '../getSpaceInviteLinks';

describe('getSpaceInviteLinks', () => {
  it('should return all invite links for a space along with their roles', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      publicProposals: true
    });

    const exampleRole = await testUtilsMembers.generateRole({
      createdBy: user.id,
      spaceId: space.id,
      roleName: 'example-role'
    });

    const spaceLinkWithRoles = await prisma.inviteLink.create({
      data: {
        code: v4(),
        author: { connect: { id: user.id } },
        space: { connect: { id: space.id } },
        inviteLinkToRoles: {
          create: {
            roleId: exampleRole.id
          }
        }
      },
      include: {
        inviteLinkToRoles: {
          include: {
            role: true
          }
        }
      }
    });

    const proposalsLink = await prisma.inviteLink.create({
      data: {
        code: v4(),
        author: { connect: { id: user.id } },
        space: { connect: { id: space.id } },
        visibleOn: 'proposals'
      },
      include: {
        inviteLinkToRoles: {
          include: {
            role: true
          }
        }
      }
    });

    // Quick test of comparison data to make sure the test makes sense
    expect(spaceLinkWithRoles.inviteLinkToRoles.length).toBe(1);

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

    const links = await getSpaceInviteLinks({
      isAdmin: true,
      spaceId: space.id
    });

    expect(links.length).toBe(2);

    expect(links).toEqual(
      expect.arrayContaining([expect.objectContaining(spaceLinkWithRoles), expect.objectContaining(proposalsLink)])
    );
  });

  it('should not include code for non-admin', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      publicProposals: true
    });

    await prisma.inviteLink.create({
      data: {
        code: v4(),
        author: { connect: { id: user.id } },
        space: { connect: { id: space.id } }
      },
      include: {
        inviteLinkToRoles: {
          include: {
            role: true
          }
        }
      }
    });

    const links = await getSpaceInviteLinks({
      isAdmin: false,
      spaceId: space.id
    });

    expect(links.length).toBe(1);
    expect(links[0].code).toBe('');
  });

  it('should not include a public proposals invite link if the space does not have public proposals enabled', async () => {
    const { user, space } = await testUtilsUser.generateUserAndSpace({
      publicProposals: false
    });
    const spaceLinkWithRoles = await prisma.inviteLink.create({
      data: {
        code: v4(),
        author: { connect: { id: user.id } },
        space: { connect: { id: space.id } }
      },
      include: {
        inviteLinkToRoles: {
          include: {
            role: true
          }
        }
      }
    });

    const proposalsLink = await prisma.inviteLink.create({
      data: {
        code: v4(),
        author: { connect: { id: user.id } },
        space: { connect: { id: space.id } },
        visibleOn: 'proposals'
      },
      include: {
        inviteLinkToRoles: {
          include: {
            role: true
          }
        }
      }
    });

    const links = await getSpaceInviteLinks({
      isAdmin: true,
      spaceId: space.id
    });

    expect(links.length).toBe(1);

    expect(links[0]).toMatchObject(expect.objectContaining(spaceLinkWithRoles));
  });

  it('should throw an error if spaceId is invalid', async () => {
    await expect(getSpaceInviteLinks({ isAdmin: true, spaceId: undefined as any })).rejects.toBeInstanceOf(
      InvalidInputError
    );
    await expect(getSpaceInviteLinks({ isAdmin: true, spaceId: 'not-a-uuid' })).rejects.toBeInstanceOf(
      InvalidInputError
    );
  });
});
