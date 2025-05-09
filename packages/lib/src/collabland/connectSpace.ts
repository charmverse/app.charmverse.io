import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { decryptData } from '@packages/utils/dataEncryption';
import { updateMemberRolesFromDiscord } from '@packages/lib/discord/collabland/updateMemberRolesFromDiscord';
import { upsertSpaceRolesFromDiscord } from '@packages/lib/discord/collabland/upsertSpaceRolesFromDiscord';
import { mapSpace } from 'lib/public-api/createWorkspaceApi';

import { createAndAssignCollablandRoles } from './assignRolesCollabland';
import { getDiscordUserState } from './collablandClient';

export async function connectSpace({ state, discordServerId }: { state: string; discordServerId: string }) {
  if (!discordServerId) {
    throw new InvalidInputError('A discord server ID must be provided');
  }

  const spaceData = decryptData(state);

  if (
    !spaceData ||
    typeof spaceData !== 'object' ||
    !spaceData.hasOwnProperty('spaceId') ||
    !spaceData.hasOwnProperty('userId')
  ) {
    throw new InvalidInputError('Invalid template provided');
  }

  const { userId, spaceId } = spaceData as { userId: string; spaceId: string };

  const spaceRole = await prisma.spaceRole.findFirst({
    where: {
      userId,
      spaceId,
      isAdmin: true
    },
    select: {
      space: true
    }
  });

  if (!spaceRole || !spaceRole.space) {
    throw new InvalidInputError('Cannot find space to connect');
  }
  await upsertSpaceRolesFromDiscord({
    spaceId: spaceRole.space.id,
    discordServerId,
    userId
  });

  const space = await prisma.space.update({ where: { id: spaceId }, data: { discordServerId } });

  const spaceMembers = await prisma.spaceRole.findMany({
    where: {
      spaceId,
      user: {
        discordUser: {
          isNot: null
        }
      }
    },
    select: {
      user: {
        select: {
          id: true,
          discordUser: {
            select: {
              discordId: true
            }
          }
        }
      }
    }
  });

  for (const spaceMember of spaceMembers) {
    if (spaceMember.user.discordUser) {
      const { roles: updatedRoles } = await getDiscordUserState({
        discordServerId,
        discordUserId: spaceMember.user.discordUser.discordId
      });

      await createAndAssignCollablandRoles({
        roles: updatedRoles.map((r) => String(r.id)),
        spaceId,
        userId: spaceMember.user.id
      });
    }
  }

  await updateMemberRolesFromDiscord({
    spaceId,
    discordServerId
  });

  return mapSpace(space);
}
