import { prisma } from '@charmverse/core/prisma-client';
import type { ProfileFragment } from '@lens-protocol/client';

import { lensClient } from './lensClient';

export async function getDefaultLensProfile(userId: string): Promise<ProfileFragment | null> {
  const user = await prisma.user.findUnique({
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

  if (!user) {
    return null;
  }

  const walletAddresses = user.wallets.map((wallet) => wallet.address);
  if (walletAddresses.length === 0) {
    return null;
  }

  // test wallet: 0x2b3DaEB14f069dB301cEAD63338a56d27A982CED
  const ownedProfiles = await lensClient.profile.fetchAll({
    ownedBy: walletAddresses,
    limit: 1
  });

  if (ownedProfiles.items.length !== 0) {
    return ownedProfiles.items[0];
  }

  return null;
}
