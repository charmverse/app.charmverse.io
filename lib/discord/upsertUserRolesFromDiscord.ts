import type { Space } from '@prisma/client';

import { prisma } from 'db';
import { verifyDiscordGateForSpace } from 'lib/discord/verifyDiscordGateForSpace';
import { createAndAssignRoles } from 'lib/roles/createAndAssignRoles';

type Props = {
  space: Space;
  userId: string;
};

export async function upsertUserRolesFromDiscord({ space, userId }: Props) {
  const user = await prisma.user.findFirst({ where: { id: userId }, include: { discordUser: true } });
  const { isEligible, roles } = await verifyDiscordGateForSpace({ space, discordUserId: user?.discordUser?.discordId });

  if (isEligible) {
    return createAndAssignRoles({ userId, spaceId: space.id, roles });
  }
}
