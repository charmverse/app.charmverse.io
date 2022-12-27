import { prisma } from 'db';
import { getSpaceAndUserFromDiscord } from 'lib/discord/getSpaceAndUserFromDiscord';

export async function removeSpaceMemberDiscord({
  discordUserId,
  discordServerId
}: {
  discordUserId: string;
  discordServerId: string;
}) {
  const { space, user } = await getSpaceAndUserFromDiscord({ discordUserId, discordServerId });

  return prisma.spaceRole.delete({
    where: {
      spaceUser: {
        spaceId: space.id,
        userId: user.id
      }
    }
  });
}
