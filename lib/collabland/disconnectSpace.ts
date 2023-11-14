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
          },
          isAdmin: true
        },
        select: {
          spaceId: true,
          isAdmin: true
        }
      }
    }
  });

  if (!user) {
    return {
      spaceIds: []
    };
  }

  const spaceIds = user.spaceRoles.map((role) => role.spaceId);

  await prisma.$transaction([
    prisma.space.updateMany({
      where: {
        id: {
          in: spaceIds
        }
      },
      data: {
        discordServerId: null
      }
    }),
    prisma.role.deleteMany({
      where: {
        source: 'collabland',
        spaceId: {
          in: spaceIds
        }
      }
    })
  ]);

  return {
    spaceIds
  };
}
