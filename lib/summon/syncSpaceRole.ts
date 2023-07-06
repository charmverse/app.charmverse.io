import { log } from '@charmverse/core/log';
import type { UserWallet } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { findUserByIdentity, getUserInventory } from './api';

export async function syncSpaceRole({ spaceId }: { spaceId: string }) {
  const space = await prisma.space.findUniqueOrThrow({
    where: {
      id: spaceId
    }
  });

  if (!space.xpsEngineId) {
    log.debug('Space does not have a Summon tenant ID', { spaceId });
    return;
  }

  const spaceRoles = await prisma.spaceRole.findMany({
    where: {
      spaceId
    },
    select: {
      id: true,
      user: {
        select: {
          xpsEngineId: true,
          id: true,
          discordUser: {
            select: {
              account: true
            }
          },
          email: true,
          wallets: {
            select: {
              address: true
            }
          }
        }
      }
    }
  });

  const spaceRoleToRoles = await prisma.spaceRoleToRole.findMany({
    where: {
      role: {
        source: 'game7',
        spaceId
      }
    },
    select: {
      spaceRole: {
        select: {
          userId: true
        }
      },
      role: {
        select: {
          name: true,
          id: true
        }
      }
    }
  });

  const rolesRecord: Record<
    string,
    {
      id: string;
      name: string;
      memberIds: string[];
    }
  > = {};

  spaceRoleToRoles.forEach((spaceRoleToRole) => {
    if (!rolesRecord[spaceRoleToRole.role.name]) {
      rolesRecord[spaceRoleToRole.role.name] = {
        id: spaceRoleToRole.role.id,
        name: spaceRoleToRole.role.name,
        memberIds: []
      };
    }
    rolesRecord[spaceRoleToRole.role.name].memberIds.push(spaceRoleToRole.spaceRole.userId);
  });

  for (const spaceRole of spaceRoles) {
    const xpsEngineId = await findUserXpsEngineId({
      discordUserAccount: (spaceRole.user.discordUser?.account as { username: string; discriminator: string }) ?? null,
      userEmail: spaceRole.user.email,
      wallets: spaceRole.user.wallets,
      xpsEngineId: spaceRole.user.xpsEngineId
    });

    if (xpsEngineId) {
      const userInventory = await getUserInventory(xpsEngineId);
      if (userInventory && userInventory.tenant === space.xpsEngineId) {
        const userRank = userInventory?.meta.rank ?? 0;
        if (!rolesRecord[`Level ${userRank}`]) {
          const role = await prisma.role.create({
            data: {
              name: `Level ${userRank}`,
              source: 'game7',
              spaceId,
              createdBy: space.createdBy
            }
          });

          rolesRecord[role.name] = {
            id: role.id,
            name: role.name,
            memberIds: []
          };
        }

        const currentRole = Object.values(rolesRecord).find((role) => role.memberIds.includes(spaceRole.user.id));
        const newRole = rolesRecord[`Level ${userRank}`];

        // If the user has a game7 role, but its different than the current one, replace it
        if (currentRole && currentRole.name !== `Level ${userRank}`) {
          await prisma.spaceRoleToRole.updateMany({
            where: {
              roleId: currentRole.id,
              spaceRoleId: spaceRole.id
            },
            data: {
              roleId: newRole.id
            }
          });
          rolesRecord[currentRole.name].memberIds = rolesRecord[currentRole.name].memberIds.filter(
            (memberId) => memberId !== spaceRole.user.id
          );
          rolesRecord[`Level ${userRank}`].memberIds.push(spaceRole.user.id);
        } else if (!currentRole) {
          await prisma.spaceRoleToRole.create({
            data: {
              roleId: newRole.id,
              spaceRoleId: spaceRole.id
            }
          });
          rolesRecord[`Level ${userRank}`].memberIds.push(spaceRole.user.id);
        }
      }
    }
  }
}

async function findUserXpsEngineId({
  wallets,
  xpsEngineId: initialXpsEngineId,
  userEmail,
  discordUserAccount
}: {
  discordUserAccount: { username: string; discriminator: string } | null;
  userEmail: string | null;
  xpsEngineId: string | null;
  wallets: Pick<UserWallet, 'address'>[];
}) {
  let xpsEngineId = initialXpsEngineId ?? null;

  if (!xpsEngineId) {
    const walletAddresses = wallets.map(({ address }) => address);

    for (const walletAddress of walletAddresses) {
      xpsEngineId = await findUserByIdentity({
        walletAddress
      });

      if (xpsEngineId) {
        break;
      }
    }

    if (!xpsEngineId && userEmail) {
      xpsEngineId = await findUserByIdentity({
        email: userEmail
      });
    }

    if (discordUserAccount && !xpsEngineId) {
      xpsEngineId = await findUserByIdentity({
        discordHandle: `${discordUserAccount.username}#${discordUserAccount.discriminator}`
      });
    }
  }

  return xpsEngineId;
}
