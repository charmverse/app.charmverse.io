import { prisma } from '@charmverse/core/prisma-client';

import type { DiscordAccount } from 'lib/discord/client/getDiscordAccount';
import { shortenHex } from 'lib/utilities/blockchain';
import type { TelegramAccount } from 'pages/api/telegram/connect';

export async function getMemberUsername({ spaceRoleId }: { spaceRoleId: string }) {
  const spaceRole = await prisma.spaceRole.findUniqueOrThrow({
    where: {
      id: spaceRoleId
    },
    select: {
      user: {
        select: {
          username: true,
          discordUser: {
            select: {
              account: true
            }
          },
          googleAccounts: {
            select: {
              name: true
            }
          },
          telegramUser: {
            select: {
              account: true
            }
          },
          wallets: {
            select: {
              address: true,
              ensname: true
            }
          }
        }
      },
      space: {
        select: {
          primaryMemberIdentity: true
        }
      }
    }
  });

  const primaryMemberIdentity = spaceRole.space.primaryMemberIdentity;

  const username = spaceRole.user.username;
  if (!primaryMemberIdentity) {
    return username;
  }

  if (primaryMemberIdentity === 'google') {
    const firstGoogleAccount = spaceRole.user.googleAccounts[0];
    if (!firstGoogleAccount) {
      return username;
    }
    return firstGoogleAccount.name;
  }

  if (primaryMemberIdentity === 'discord') {
    const discordUserAccount = spaceRole.user.discordUser?.account as unknown as DiscordAccount;
    if (!discordUserAccount) {
      return username;
    }
    return discordUserAccount.username;
  }

  if (primaryMemberIdentity === 'telegram') {
    const telegramUserAccount = spaceRole.user.telegramUser?.account as unknown as TelegramAccount;
    if (!telegramUserAccount) {
      return username;
    }
    return telegramUserAccount.username;
  }

  if (primaryMemberIdentity === 'wallet') {
    const firstWallet = spaceRole.user.wallets[0];
    if (!firstWallet) {
      return username;
    }
    return firstWallet.ensname || shortenHex(firstWallet.address);
  }

  return username;
}
