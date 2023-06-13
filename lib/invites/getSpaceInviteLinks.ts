import { InvalidInputError } from '@charmverse/core/errors';
import type { InviteLink, Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

export type InviteLinkWithRoles = InviteLink & {
  roleIds: string[];
};

export async function getSpaceInviteLinks({ spaceId }: { spaceId: string }): Promise<InviteLinkWithRoles[]> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`Valid spaceId is required`);
  }

  const links = await prisma.inviteLink.findMany({
    where: {
      spaceId
    },
    include: {
      inviteLinkToRoles: {
        include: {
          role: true
        }
      }
    }
  });

  let mappedLinks = links.map((link) => {
    return {
      ...link,
      roleIds: link.inviteLinkToRoles.map((linkToRole) => linkToRole.roleId)
    };
  });

  if (mappedLinks.some((link) => link.visibleOn === 'proposals')) {
    const space = (await prisma.space.findUnique({
      where: {
        id: spaceId
      }
    })) as Space;

    // Remove public links if these don't exist
    if (!space.publicProposals) {
      mappedLinks = mappedLinks.filter((link) => !link.visibleOn);
    }
  }

  return mappedLinks;
}
