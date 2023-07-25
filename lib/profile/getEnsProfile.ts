import { prisma } from '@charmverse/core/prisma-client';

import { getENSDetails } from 'lib/blockchain';

export type EnsProfile = {
  ensname: string | null;
  description?: string;
  avatar?: string | null;
  discord?: string;
  github?: string;
  twitter?: string;
  reddit?: string;
  linkedin?: string;
  emails?: string;
};

export async function getEnsProfile({ userId }: { userId: string }) {
  const user = await prisma.user.findUnique({
    where: {
      id: userId
    },
    select: {
      wallets: {
        select: {
          ensname: true
        }
      }
    }
  });

  const userWallets = user?.wallets.filter((wallet) => wallet.ensname) || [];

  let ensProfile: EnsProfile | null = null;

  for (const wallet of userWallets) {
    const ensDetails = await getENSDetails(wallet.ensname);
    if (ensDetails) {
      ensProfile = {
        ...ensDetails,
        ensname: wallet.ensname
      };
    }
  }

  return ensProfile;
}
