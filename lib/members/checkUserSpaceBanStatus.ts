import { prisma } from '@charmverse/core/prisma-client';

export async function checkUserSpaceBanStatus({
  spaceIds,
  userId,
  discordId,
  walletAddresses,
  emails
}: {
  walletAddresses?: string[];
  discordId?: string;
  emails?: string[];
  userId?: string;
  spaceIds: string[];
}) {
  if (!userId && !discordId && (!walletAddresses || walletAddresses.length === 0) && (!emails || emails.length === 0)) {
    return false;
  }

  const userWalletAddresses: string[] = walletAddresses ?? [];
  const userEmails: string[] = emails ?? [];
  const userDiscordIds: string[] = discordId ? [discordId] : [];

  if (userId) {
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

      const _userDiscordId = user.discordUser?.discordId;
      if (_userDiscordId) {
        userDiscordIds.push(_userDiscordId);
      }
    }
  }

  const blacklistedUserByIdentity = await prisma.blacklistedSpaceUser.findFirst({
    where: {
      AND: {
        spaceId: {
          in: spaceIds
        },
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
    }
  });

  return blacklistedUserByIdentity !== null;
}
