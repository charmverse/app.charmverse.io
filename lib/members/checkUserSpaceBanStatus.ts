import type { Prisma } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export async function checkUserSpaceBanStatus({ spaceId, userId }: { userId: string; spaceId: string }) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    include: {
      discordUser: true,
      verifiedEmails: true,
      wallets: true,
      googleAccounts: true
    }
  });

  if (!user) {
    return false;
  }

  const userWalletAddresses = user.wallets.map(({ address }) => address);
  const userDiscordId = user.discordUser?.discordId;
  const userEmails = [
    ...user.verifiedEmails.map(({ email }) => email),
    ...user.googleAccounts.map(({ email }) => email)
  ];

  const blackListedSpaceUserWhereClause: Prisma.BlacklistedSpaceUserWhereInput = {
    spaceId
  };

  if (userDiscordId) {
    blackListedSpaceUserWhereClause.discordId = userDiscordId;
  }

  if (userWalletAddresses.length > 0) {
    blackListedSpaceUserWhereClause.walletAddresses = {
      hasSome: userWalletAddresses
    };
  }

  const blacklistedUserByIdentity = await prisma.blacklistedSpaceUser.findFirst({
    where: {
      spaceId,
      OR: [
        {
          userId
        },
        {
          walletAddresses: {
            hasSome: userWalletAddresses
          }
        },
        {
          discordId: userDiscordId
        },
        {
          emails: {
            hasSome: userEmails
          }
        }
      ]
    }
  });

  return blacklistedUserByIdentity !== null;
}
