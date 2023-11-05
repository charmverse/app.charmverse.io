import { prisma } from '@charmverse/core/prisma-client';

import * as api from 'lib/summon/api';
import type { SummonUserProfile } from 'lib/summon/interfaces';

export async function getSummonProfile({
  userId,
  summonApiUrl = api.SUMMON_BASE_URL
}: {
  summonApiUrl?: string;
  userId: string;
}): Promise<null | SummonUserProfile> {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      xpsEngineId: true,
      wallets: {
        select: {
          address: true
        }
      },
      googleAccounts: true,
      discordUser: {
        select: {
          account: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  const discordUserAccount = user.discordUser?.account as { username: string } | null;
  const userEmail = user.googleAccounts[0]?.email;
  const walletAddresses = user.wallets.map((wallet) => wallet.address);

  const xpsEngineId =
    user.xpsEngineId ??
    (await api.findUserXpsEngineId({
      discordUserAccount,
      userEmail,
      walletAddresses,
      summonApiUrl
    }));

  if (!xpsEngineId) {
    return null;
  }

  return api.getUserSummonProfile({
    xpsEngineId,
    summonApiUrl
  });
}
