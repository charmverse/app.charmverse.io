import { prisma } from '@charmverse/core/prisma-client';

export async function checkUserBlacklistStatus(userId: string) {
  const userWalletAddresses: string[] = [];
  const userEmails: string[] = [];
  let userDiscordId: string | null = null;

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

    userDiscordId = user.discordUser?.discordId ?? null;
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
