import { DataNotFoundError, InvalidInputError, UnauthorisedActionError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { logInviteAccepted } from 'lib/metrics/postToDiscord';
import { joinSpace } from 'lib/spaces/joinSpace';

import { validateInviteLink } from './validateInviteLink';

export type InviteLinkAcceptance = {
  inviteLinkId: string;
  userId: string;
};

export async function acceptInvite({ inviteLinkId, userId }: InviteLinkAcceptance): Promise<void> {
  if (!stringUtils.isUUID(inviteLinkId) || !stringUtils.isUUID(userId)) {
    throw new InvalidInputError(`Valid invite link id and user id required`);
  }

  const invite = await prisma.inviteLink.findUnique({
    where: {
      id: inviteLinkId
    },
    include: {
      space: true
    }
  });
  if (!invite) {
    throw new DataNotFoundError(`Invite with id ${inviteLinkId} not found`);
  }

  const validationResult = validateInviteLink({ invite });

  if (!validationResult.valid) {
    throw new UnauthorisedActionError(`You cannot accept this invite.`);
  }

  const targetSpaceRole = await joinSpace({ userId, spaceId: invite.spaceId, source: 'invite_link' });

  if (!targetSpaceRole) {
    return;
  }

  logInviteAccepted({ spaceId: targetSpaceRole.spaceId });

  const roleIdsToAssign: string[] = (
    await prisma.inviteLinkToRole.findMany({
      where: {
        inviteLinkId: invite.id
      },
      select: {
        roleId: true
      }
    })
  ).map(({ roleId }) => roleId);

  await prisma.$transaction([
    ...roleIdsToAssign.map((roleId) =>
      prisma.spaceRoleToRole.upsert({
        where: {
          spaceRoleId_roleId: {
            spaceRoleId: targetSpaceRole.id,
            roleId
          }
        },
        create: {
          roleId,
          spaceRoleId: targetSpaceRole.id
        },
        update: {}
      })
    ),
    prisma.inviteLink.update({
      where: { id: invite.id },
      data: {
        useCount: invite.useCount + 1
      }
    })
  ]);
}
