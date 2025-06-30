import type { SpaceRole } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { InvalidInputError, UnauthorisedActionError } from '@packages/core/errors';
import { stringUtils } from '@packages/core/utilities';
import { checkUserSpaceBanStatus } from '@packages/lib/members/checkUserSpaceBanStatus';
import { WebhookEventNames } from '@packages/lib/webhookPublisher/interfaces';
import { publishMemberEvent } from '@packages/lib/webhookPublisher/publishEvent';
import { trackUserAction } from '@packages/metrics/mixpanel/trackUserAction';

export type JoinSpaceSource = 'proposal_template' | 'invite_link';

export type Props = {
  userId: string;
  spaceId: string;
  source: JoinSpaceSource;
};

export async function joinSpace({ userId, spaceId, source }: Props): Promise<SpaceRole | void> {
  if (!stringUtils.isUUID(userId)) {
    throw new InvalidInputError(`Valid user id required`);
  }

  const isUserBannedFromSpace = await checkUserSpaceBanStatus({
    spaceIds: [spaceId],
    userId
  });

  if (isUserBannedFromSpace) {
    throw new UnauthorisedActionError(`You have been banned from this space.`);
  }

  const existingSpaceRole = await prisma.spaceRole.findFirst({
    where: {
      userId,
      spaceId
    }
  });
  // We don't need to do anything if they are already a member of the space
  if (existingSpaceRole && !existingSpaceRole.isGuest) {
    return existingSpaceRole;
    // Allow guest to become member
  }

  const targetSpaceRole = await prisma.spaceRole.upsert({
    where: {
      spaceUser: {
        userId,
        spaceId
      }
    },
    create: {
      isGuest: false,
      space: {
        connect: {
          id: spaceId
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

  // updateTrackUserProfileById(userId);
  trackUserAction('join_a_workspace', { userId, source: source || 'unknown', spaceId });
  publishMemberEvent({
    scope: WebhookEventNames.UserJoined,
    spaceId,
    userId
  });

  return targetSpaceRole;
}
