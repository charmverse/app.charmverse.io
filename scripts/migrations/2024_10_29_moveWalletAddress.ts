import { prisma } from '@charmverse/core/prisma-client';
import { getAddress } from 'viem';

// Migrate walletAddress from the scout table to the scoutWallet table
async function query() {
  const users = await prisma.scout.findMany({
    where: {
      walletAddress: {
        not: null
      }
    }
  });

  for (const user of users) {
    if (!user.walletAddress) {
      continue;
    }

    try {
      const address = getAddress(user.walletAddress);

      await prisma.scoutWallet.create({
        data: { address: address.toLowerCase(), scoutId: user.id }
      });

      await prisma.scout.update({
        where: { id: user.id },
        data: { walletAddress: null }
      });
    } catch (_err) {
      console.log('Error', { error: _err, userId: user.id });
    }

    console.log(`Migrated ${user.id} wallet address`);
  }

  console.log(`Migrated ${users.length} users`);
}

query();
