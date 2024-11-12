import { prisma } from '@charmverse/core/prisma-client';
import { getENSDetails } from '@packages/blockchain/getENSName';

export type EnsProfile = {
  ensname: string | null;
  description?: string | null;
  avatar?: string | null;
  discord?: string | null;
  github?: string | null;
  twitter?: string | null;
  reddit?: string | null;
  linkedin?: string | null;
  emails?: string | null;
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
    if (ensDetails && wallet.ensname) {
      ensProfile = {
        ...ensDetails,
        ensname: wallet.ensname || ''
      };
    }
  }

  return ensProfile;
}
