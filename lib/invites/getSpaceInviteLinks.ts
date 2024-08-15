import { InvalidInputError } from '@charmverse/core/errors';
import type { InviteLink, Space } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

export type InviteLinkWithRoles = InviteLink & {
  roleIds: string[];
};

export async function getSpaceInviteLinks({
  isAdmin,
  spaceId
}: {
  isAdmin: boolean;
  spaceId: string;
}): Promise<InviteLinkWithRoles[]> {
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
    const code = isAdmin ? link.code : '';
    return {
      ...link,
      code,
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

  // Only return public proposals links for non admins
  if (!isAdmin) {
    mappedLinks = mappedLinks.filter((link) => !!link.visibleOn);
  }

  return mappedLinks;
}
