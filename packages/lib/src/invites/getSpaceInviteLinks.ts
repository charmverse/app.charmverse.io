import type { InviteLink, Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError } from '@packages/core/errors';
import { hasAccessToSpace } from '@packages/core/permissions';
import { stringUtils } from '@packages/core/utilities';

export type InviteLinkWithRoles = InviteLink & {
  roleIds: string[];
};

export async function getSpaceInviteLinks({
  userId,
  spaceId
}: {
  userId?: string;
  spaceId: string;
}): Promise<InviteLinkWithRoles[]> {
  if (!stringUtils.isUUID(spaceId)) {
    throw new InvalidInputError(`Valid spaceId is required`);
  }

  const { isAdmin } = await hasAccessToSpace({ userId, spaceId });

  const query: Prisma.InviteLinkWhereInput = {
    spaceId
  };

  if (!isAdmin) {
    const space = await prisma.space.findUniqueOrThrow({
      where: {
        id: spaceId
      },
      select: {
        publicProposals: true
      }
    });

    // If user isn't an admin, we can at most return the public proposals invite link
    if (space.publicProposals) {
      query.visibleOn = 'proposals';
    } else {
      // User won't be entitled to see any invite links
      return [];
    }
  }

  const links = await prisma.inviteLink.findMany({
    where: query,
    include: {
      inviteLinkToRoles: {
        include: {
          role: true
        }
      }
    }
  });

  const mappedLinks = links.map((link) => {
    return {
      ...link,
      inviteLinkToRoles: undefined,
      roleIds: link.inviteLinkToRoles.map((linkToRole) => linkToRole.roleId)
    };
  });

  return mappedLinks;
}
