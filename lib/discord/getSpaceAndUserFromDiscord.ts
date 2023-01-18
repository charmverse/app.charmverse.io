import { prisma } from 'db';
import { getSpacesFromDiscord } from 'lib/discord/getSpaceFromDiscord';
import { InvalidInputError } from 'lib/utilities/errors';

export async function getSpacesAndUserFromDiscord({
  discordServerId,
  discordUserId
}: {
  discordServerId: string;
  discordUserId: string;
}) {
  const spaces = await getSpacesFromDiscord(discordServerId);

  if (!spaces.length) {
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

  return spaces.map((space) => ({ space, user }));
}
