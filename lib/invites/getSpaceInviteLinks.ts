import { InvalidInputError } from '@charmverse/core/errors';
import type { InviteLink, InviteLinkToRole, Role } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

export type InviteLinkPopulatedWithRoles = InviteLink & {
  inviteLinkToRoles: (InviteLinkToRole & { role: Role })[];
};

export async function getSpaceInviteLinks({ spaceId }: { spaceId: string }): Promise<InviteLinkPopulatedWithRoles[]> {
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

  return links;
}
