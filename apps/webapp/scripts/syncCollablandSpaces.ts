import { DiscordUser, Role, Space, User, prisma } from '@charmverse/core/prisma-client';
import { assignRolesCollabland } from 'lib/collabland/assignRolesCollabland';
import { getDiscordUserState } from 'lib/collabland/collablandClient';
import { unassignRolesDiscord } from 'lib/discord/unassignRolesDiscord';

export async function syncCollablandSpaces() {
  const usersToSync = await prisma.spaceRole.findMany({
    where: {
      // only spaces with discord servers
      space: {
        discordServerId: { not: null },
        superApiTokenId: '3178aeb1-7b14-4a83-85d3-4bfa3152c998' // collabland
      },
      user: {
        // only users connected to discord
        discordUser: { is: {} }
      }
    },
    include: {
      space: true,
      user: {
        include: {
          discordUser: true
        }
      },
      spaceRoleToRole: {
        include: {
          role: true
        }
      }
    }
  });

  console.log('🔥 number of users to sync:', usersToSync.length);

  let processed = 0;
  for (const syncUser of usersToSync) {
    const currentRoles = syncUser.spaceRoleToRole.map((r) => r.role);
    await syncDiscordUser({ currentRoles, space: syncUser.space, user: syncUser.user });
    processed++;
    console.log('🔥 processed:', processed);
  }
}

async function syncDiscordUser({
  currentRoles,
  space,
  user
}: {
  space: Space;
  currentRoles: Role[];
  user: User & { discordUser: DiscordUser | null };
}) {
  if (!space.discordServerId || user.discordUser === null) {
    return;
  }
  const {
    discordUser: { discordId: discordUserId }
  } = user;
  const { discordServerId } = space;

  // consider only roles in CV that ocmes from collabland
  const oldRoles = currentRoles
    .filter((r) => r.source === 'collabland')
    .map((r) => r.externalId)
    .filter((r): r is string => r !== null);

  const { roles: updatedRoles } = await getDiscordUserState({
    discordServerId: space.discordServerId,
    discordUserId: user.discordUser.discordId
  });

  const newRoles = updatedRoles.map((r) => String(r.id));

  const rolesAdded = newRoles.filter((role) => !oldRoles.includes(role));
  const rolesRemoved = oldRoles.filter((role) => !newRoles.includes(role));

  if (rolesAdded.length) {
    await assignRolesCollabland({ discordUserId, discordServerId, roles: rolesAdded });
  }

  if (rolesRemoved.length) {
    await unassignRolesDiscord({ discordUserId, discordServerId, roles: rolesRemoved });
  }

  console.log('🔥 user:', user.id);
  console.log('🔥 added roles:', rolesAdded.length);
  console.log('🔥 removed roles:', rolesRemoved.length);
  console.log('🔥 ---');
}

syncCollablandSpaces();
