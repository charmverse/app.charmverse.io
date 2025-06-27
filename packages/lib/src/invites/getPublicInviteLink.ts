import { PublicInviteLinkContext, prisma } from '@charmverse/core/prisma-client';
import { DataNotFoundError, InvalidInputError } from '@packages/core/errors';
import { stringUtils } from '@packages/core/utilities';

import type { InviteLinkPopulated } from './getInviteLink';

export type PublicInviteLinkRequest = {
  spaceId: string;
  visibleOn: PublicInviteLinkContext;
};

export async function getPublicInviteLink({
  visibleOn,
  spaceId
}: PublicInviteLinkRequest): Promise<InviteLinkPopulated> {
  if (!stringUtils.isUUID(spaceId) || !visibleOn || !PublicInviteLinkContext[visibleOn]) {
    throw new InvalidInputError(`Valid space ID and public context are required.`);
  }

  const invite = await prisma.inviteLink.findUnique({
    where: {
      spaceId_visibleOn: {
        spaceId,
        visibleOn
      }
    },
    include: {
      space: true
    }
  });

  if (!invite) {
    throw new DataNotFoundError(`Invite link not found.`);
  }

  return invite;
}
