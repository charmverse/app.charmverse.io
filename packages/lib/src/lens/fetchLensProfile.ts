import { prisma } from '@charmverse/core/prisma-client';

export async function fetchLensProfile(userId: string) {
  try {
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

    const { lensClient } = await import('./lensClient');

    const profile = await lensClient.profile.fetchAll({
      where: {
        ownedBy: walletAddresses
      }
    });

    return profile.items[0] ?? null;
  } catch (_) {
    // On testnet if there is no profile it throws an error
    return null;
  }
}
