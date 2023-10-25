import { DataNotFoundError, InvalidInputError, UnauthorisedActionError } from '@charmverse/core/errors';
import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { stringUtils } from '@charmverse/core/utilities';

import { checkUserSpaceBanStatus } from 'lib/members/checkUserSpaceBanStatus';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { updateTrackUserProfileById } from 'lib/metrics/mixpanel/updateTrackUserProfileById';
import { logInviteAccepted } from 'lib/metrics/postToDiscord';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishMemberEvent } from 'lib/webhookPublisher/publishEvent';

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

  const isUserBannedFromSpace = await checkUserSpaceBanStatus({
    spaceId: invite.spaceId,
    userId
  });

  if (isUserBannedFromSpace) {
    throw new UnauthorisedActionError(`You have been banned from this space.`);
  }

  const existingSpaceRole = await prisma.spaceRole.findFirst({
    where: {
      userId,
      spaceId: invite.spaceId
    }
  });
  // We don't need to do anything if they are already a member of the space
  if (existingSpaceRole && (!existingSpaceRole?.isGuest || existingSpaceRole?.isAdmin)) {
    return;
    // Allow guest to become member
  }

  // Only proceed if they are not a member of the space
  log.info('User joined space via invite', { spaceId: invite.spaceId, userId });
  const targetSpaceRole = await prisma.spaceRole.upsert({
    where: {
      spaceUser: {
        userId,
        spaceId: invite.spaceId
      }
    },
    create: {
      isGuest: false,
      space: {
        connect: {
          id: invite.spaceId
        }
      },
      user: {
        connect: {
          id: userId
        }
      },
      joinedViaLink: true
    },
    update: {
      isGuest: false
    }
  });
  logInviteAccepted({ spaceId: targetSpaceRole.spaceId });

  updateTrackUserProfileById(userId);
  trackUserAction('join_a_workspace', { userId, source: 'invite_link', spaceId: invite.spaceId });
  publishMemberEvent({
    scope: WebhookEventNames.UserJoined,
    spaceId: invite.spaceId,
    userId
  });

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
