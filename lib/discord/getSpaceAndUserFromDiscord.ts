import { prisma } from 'db';
import { getSpaceFromDiscord } from 'lib/discord/getSpaceFromDiscord';
import { InvalidInputError } from 'lib/utilities/errors';

export async function getSpaceAndUserFromDiscord({
  discordServerId,
  discordUserId
}: {
  discordServerId: string;
  discordUserId: string;
}) {
  const space = await getSpaceFromDiscord(discordServerId);

  if (!space) {
    throw new InvalidInputError('Space not found');
  }

  const user = await prisma.user.findFirst({
    where: {
      discordUser: {
        discordId: discordUserId
      }
    }
  });

  if (!user) {
    throw new InvalidInputError('User not found');
  }

  return { space, user };
}
