import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';
import { createAndAssignCollablandRoles } from 'lib/collabland/assignRolesCollabland';
import { getDiscordUserState } from 'lib/collabland/collablandClient';
import { upsertSpaceRolesFromDiscord } from 'lib/discord/collabland/upsertSpaceRolesFromDiscord';

export async function syncCollablandRoles() {
  const spaces = await prisma.space.findMany({
    where: {
      discordServerId: {
        not: null
      }
    },
    select: {
      discordServerId: true,
      id: true,
      createdBy: true
    }
  })

  const totalSpaces = spaces.length;
  let currentSpace = 0;

  for (const space of spaces) {
    try {
      const discordServerId = space.discordServerId;

      if (!discordServerId) {
        continue;
      }

      const spaceRole = await prisma.spaceRole.findFirst({
        where: {
          userId: space.createdBy,
          spaceId: space.id,
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
        userId: space.createdBy
      });

      const spaceMembers = await prisma.spaceRole.findMany({
        where: {
          spaceId: spaceRole.space.id,
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
            spaceId: spaceRole.space.id,
            userId: spaceMember.user.id
          });
        }
      }
    } catch (err: any) {
      console.log(`Error syncing space ${space.id}: ${err.message}`)
    }

    currentSpace += 1;
    console.log(`Done ${currentSpace} of ${totalSpaces}`);
  }
}

syncCollablandRoles();
