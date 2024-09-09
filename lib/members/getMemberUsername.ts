import type { IdentityType } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import type { DiscordAccount } from '@root/lib/discord/client/getDiscordAccount';
import { shortenHex } from '@root/lib/utils/blockchain';

import type { TelegramAccount } from 'lib/telegram/interfaces';

export type UserIdentities = {
  username: string;
  discordUser?: { account: DiscordAccount } | null;
  googleAccounts?: { name: string }[];
  telegramUser?: { account: TelegramAccount } | null;
  wallets?: { address: string; ensname?: string }[];
};

export async function getMemberUsernameBySpaceRole({ spaceRoleId }: { spaceRoleId: string }) {
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

  return getMemberUsername({
    user: spaceRole.user as UserIdentities,
    primaryMemberIdentity
  });
}

export function getMemberUsername({
  user,
  primaryMemberIdentity
}: {
  primaryMemberIdentity: IdentityType | null;
  user: UserIdentities;
}) {
  const username = user.username;
  if (!primaryMemberIdentity) {
    return username;
  }

  if (primaryMemberIdentity === 'Google') {
    const firstGoogleAccount = user.googleAccounts?.[0];
    if (!firstGoogleAccount) {
      return username;
    }
    return firstGoogleAccount.name;
  }

  if (primaryMemberIdentity === 'Discord') {
    const discordUserAccount = user.discordUser?.account as unknown as DiscordAccount;
    if (!discordUserAccount) {
      return username;
    }
    return discordUserAccount.username;
  }

  if (primaryMemberIdentity === 'Telegram') {
    const telegramUserAccount = user.telegramUser?.account as unknown as TelegramAccount;
    if (!telegramUserAccount) {
      return username;
    }
    return telegramUserAccount.username;
  }

  if (primaryMemberIdentity === 'Wallet') {
    const firstWallet = user.wallets?.[0];
    if (!firstWallet) {
      return username;
    }
    return firstWallet.ensname || shortenHex(firstWallet.address);
  }

  return username;
}
