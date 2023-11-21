import { prisma } from '@charmverse/core/prisma-client';

export async function checkUserBlacklistStatus(userId: string) {
  const userWalletAddresses: string[] = [];
  const userEmails: string[] = [];
  const userDiscordIds: string[] = [];

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

  if (user) {
    userWalletAddresses.push(...user.wallets.map(({ address }) => address));
    userEmails.push(
      ...[...user.verifiedEmails.map(({ email }) => email), ...user.googleAccounts.map(({ email }) => email)]
    );

    if (user.discordUser) {
      userDiscordIds.push(user.discordUser.discordId);
    }
  }

  const blacklistedUserByIdentity = await prisma.blacklistedUser.findFirst({
    where: {
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
          discordId: {
            in: userDiscordIds
          }
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
