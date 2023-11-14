import { DataNotFoundError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

export async function disconnectSpace({
  discordServerId,
  discordUserId
}: {
  discordUserId: string;
  discordServerId: string;
}) {
  const user = await prisma.user.findFirst({
    where: {
      discordUser: {
        discordId: discordUserId
      }
    },
    select: {
      spaceRoles: {
        where: {
          space: {
            discordServerId
          }
        },
        select: {
          spaceId: true,
          isAdmin: true
        }
      }
    }
  });

  if (!user) {
    throw new DataNotFoundError('Cannot find user to disconnect');
  }

  const adminSpaceIds = user.spaceRoles.filter((role) => role.isAdmin).map((role) => role.spaceId);

  await prisma.space.updateMany({
    where: {
      id: {
        in: adminSpaceIds
      }
    },
    data: {
      discordServerId: null
    }
  });

  await prisma.role.deleteMany({
    where: {
      source: 'collabland',
      spaceId: {
        in: adminSpaceIds
      }
    }
  });

  return {
    spaceIds: adminSpaceIds
  };
}
