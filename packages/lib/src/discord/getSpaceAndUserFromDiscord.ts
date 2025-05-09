import { prisma } from '@charmverse/core/prisma-client';
import { getSpacesFromDiscord } from '@packages/lib/discord/getSpaceFromDiscord';

export async function getSpacesAndUserFromDiscord({
  discordServerId,
  discordUserId
}: {
  discordServerId: string;
  discordUserId: string;
}) {
  const spaces = await getSpacesFromDiscord(discordServerId);

  if (!spaces.length) {
    return null;
  }

  const user = await prisma.user.findFirst({
    where: {
      discordUser: {
        discordId: discordUserId
      }
    }
  });

  if (!user) {
    return null;
  }

  return spaces.map((space) => ({ space, user }));
}
