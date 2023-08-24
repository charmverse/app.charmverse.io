import { prisma } from '@charmverse/core/prisma-client';
import type { ProfileFragment } from '@lens-protocol/client';

import { lensClient } from 'lib/lens/lensClient';

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

  const ownedProfiles = await lensClient.profile.fetchAll({
    ownedBy: walletAddresses
  });

  if (ownedProfiles.items.length !== 0) {
    return ownedProfiles.items.find((ownedProfile) => ownedProfile.isDefault) ?? ownedProfiles.items[0];
  }

  return null;
}
