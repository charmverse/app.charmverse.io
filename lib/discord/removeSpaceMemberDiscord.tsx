import { prisma } from '@charmverse/core/prisma-client';

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

  await Promise.allSettled(
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
  return { spaceId: spacesData[0].space.id, userId: spacesData[0].user.id };
}
