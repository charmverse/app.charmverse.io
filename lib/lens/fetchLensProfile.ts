import { prisma } from '@charmverse/core/prisma-client';

import { lensClient } from './lensClient';

export async function fetchLensProfile(userId: string) {
  const user = await prisma.user.findUniqueOrThrow({
    where: {
      id: userId
    },
    select: {
      wallets: {
        select: {
          address: true
        }
      }
    }
  });

  const walletAddresses = user.wallets.map((wallet) => wallet.address);
  if (walletAddresses.length === 0) {
    return null;
  }

  const profile = await lensClient.profile.fetchAll({
    where: {
      ownedBy: walletAddresses
    }
  });

  return profile.items[0] ?? null;
}
