import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { createAndAssignCollablandRoles } from '@packages/lib/collabland/assignRolesCollabland';
import { getDiscordUserState } from '@packages/lib/collabland/collablandClient';

export async function updateMemberRolesFromDiscord({
  spaceId,
  discordServerId
}: {
  spaceId: string;
  discordServerId: string;
}) {
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
      try {
        const { roles: updatedRoles } = await getDiscordUserState({
          discordServerId,
          discordUserId: spaceMember.user.discordUser.discordId
        });

        await createAndAssignCollablandRoles({
          roles: updatedRoles.map((r) => String(r.id)),
          spaceId,
          userId: spaceMember.user.id
        });
      } catch (error) {
        log.error('Error while updating member roles from discord', {
          error,
          spaceId,
          discordServerId,
          userId: spaceMember.user.id
        });
      }
    }
  }
}
