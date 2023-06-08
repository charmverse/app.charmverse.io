import { DataNotFoundError, InvalidInputError } from '@charmverse/core/errors';
import { PublicInviteLinkContext, prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import type { InviteLinkPopulated } from './getInviteLink';

export type PublicInviteLinkRequest = {
  spaceId: string;
  publicContext: PublicInviteLinkContext;
};

export async function getPublicInviteLink({
  publicContext,
  spaceId
}: PublicInviteLinkRequest): Promise<InviteLinkPopulated> {
  if (!stringUtils.isUUID(spaceId) || !publicContext || !PublicInviteLinkContext[publicContext]) {
    throw new InvalidInputError(`Valid space ID and public context are required.`);
  }

  const invite = await prisma.inviteLink.findUnique({
    where: {
      spaceId_publicContext: {
        spaceId,
        publicContext
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
