import { prisma } from '@charmverse/core';

import { getSpacesAndUserFromDiscord } from 'lib/discord/getSpaceAndUserFromDiscord';

export async function removeSpaceMemberDiscord({
  discordUserId,
  discordServerId
}: {
  discordUserId: string;
  discordServerId: string;
}) {
  const spacesData = await getSpacesAndUserFromDiscord({ discordUserId, discordServerId });
  if (!spacesData) {
    return;
  }

  return Promise.allSettled(
    spacesData.map(({ space, user }) =>
      prisma.spaceRole.delete({
        where: {
          spaceUser: {
            spaceId: space.id,
            userId: user.id
          }
        }
      })
    )
  );
}
