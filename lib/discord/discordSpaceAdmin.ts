import type { Space } from '@prisma/client';

import { prisma } from 'db';

export async function isSpaceDiscordAdmin ({ userId, spaceId }: { userId: string, spaceId: string }) {
  const space = await prisma.space.findUnique({
    where: {
      id: spaceId
    }
  });

  if (!space || !space.adminDiscordUserId) {
    return false;
  }

  const discordUser = await prisma.discordUser.findUnique({
    where: {
      userId
    }
  });

  return discordUser?.discordId === space.adminDiscordUserId;
}

export async function addDiscordUserAdminToSpaces ({ discordId, userId }: { discordId: string, userId: string }) {
  const spaces = await prisma.space.findMany({
    where: {
      adminDiscordUserId: discordId
    }
  });

  for (const space of spaces) {
    await prisma.spaceRole.create({
      data: {
        spaceId: space.id,
        userId,
        isAdmin: true
      }
    });
  }

  return prisma.$transaction(spaces.map(space => upsertDiscordAdminRole({ userId, spaceId: space.id })));
}

export async function grantRoleToSpaceDiscordAdmin (space: Space) {
  if (!space.adminDiscordUserId) {
    return;
  }

  const discordUser = await prisma.discordUser.findFirst({
    where: {
      discordId: space.adminDiscordUserId
    }
  });

  if (discordUser) {
    return upsertDiscordAdminRole({ userId: discordUser.userId, spaceId: space.id });
  }
}

function upsertDiscordAdminRole ({ userId, spaceId }: { userId: string, spaceId: string }) {
  return prisma.spaceRole.upsert({
    where: {
      spaceUser: {
        spaceId,
        userId
      }
    },
    update: {
      isAdmin: true
    },
    create: {
      spaceId,
      userId,
      isAdmin: true
    }
  });
}
