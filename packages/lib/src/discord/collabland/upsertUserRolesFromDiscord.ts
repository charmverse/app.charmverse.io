import type { Space } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { verifyDiscordGateForSpace } from '@packages/lib/discord/collabland/verifyDiscordGateForSpace';
import { createAndAssignRoles } from '@packages/lib/roles/createAndAssignRoles';

type Props = {
  space: Space;
  userId: string;
};

export async function upsertUserRolesFromDiscord({ space, userId }: Props) {
  const user = await prisma.user.findFirst({ where: { id: userId }, include: { discordUser: true } });
  const { isVerified, roles } = await verifyDiscordGateForSpace({ space, discordUserId: user?.discordUser?.discordId });

  if (isVerified) {
    return createAndAssignRoles({ userId, spaceId: space.id, roles });
  }
}
