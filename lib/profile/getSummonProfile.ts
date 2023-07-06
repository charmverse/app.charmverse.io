import { prisma } from '@charmverse/core/prisma-client';

import { findUserXpsEngineId, getUserSummonProfile } from 'lib/summon/api';
import type { XPSUserProfile } from 'lib/summon/interfaces';

export async function getSummonProfile({ userId }: { userId: string }): Promise<null | XPSUserProfile> {
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
      email: true,
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

  const discordUserAccount = user.discordUser?.account as { username: string; discriminator: string } | null;
  const userEmail = user.email;
  const walletAddresses = user.wallets.map((wallet) => wallet.address);

  const xpsEngineId =
    user.xpsEngineId ??
    (await findUserXpsEngineId({
      discordUserAccount,
      userEmail,
      walletAddresses
    }));

  if (!xpsEngineId) {
    return null;
  }

  return getUserSummonProfile(xpsEngineId);
}
