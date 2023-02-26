import type { Space } from '@prisma/client';

import { prisma } from 'db';
import { verifyDiscordGateForSpace } from 'lib/discord/verifyDiscordGateForSpace';
import { trackUserAction } from 'lib/metrics/mixpanel/trackUserAction';
import { createAndAssignRoles } from 'lib/roles/createAndAssignRoles';
import { InvalidInputError } from 'lib/utilities/errors';
import { WebhookEventNames } from 'lib/webhookPublisher/interfaces';
import { publishMemberEvent } from 'lib/webhookPublisher/publishEvent';

type Props = {
  spaceId: string;
  userId: string;
};

export async function applyDiscordGate({ spaceId, userId }: Props): Promise<Space | null> {
  const space = await prisma.space.findFirst({ where: { id: spaceId } });
  const user = await prisma.user.findFirst({ where: { id: userId }, include: { discordUser: true } });

  if (!space) {
    throw new InvalidInputError('Space not found');
  }

  if (!user) {
    throw new InvalidInputError('User not found');
  }

  const { isEligible, roles } = await verifyDiscordGateForSpace({ space, discordUserId: user?.discordUser?.discordId });

  if (!isEligible) {
    return null;
  }

  const spaceMembership = await prisma.spaceRole.findFirst({
    where: {
      spaceId: space.id,
      userId
    }
  });

  if (!spaceMembership) {
    await prisma.spaceRole.create({
      data: {
        isAdmin: false,
        space: {
          connect: {
            id: space.id
          }
        },
        user: {
          connect: {
            id: userId
          }
        }
      }
    });
    trackUserAction('join_a_workspace', { userId, source: 'invite_link', spaceId: space.id });
    publishMemberEvent({
      scope: WebhookEventNames.UserJoined,
      spaceId: space.id,
      userId
    });
  }

  await createAndAssignRoles({ userId, spaceId, roles });

  return space;
}
