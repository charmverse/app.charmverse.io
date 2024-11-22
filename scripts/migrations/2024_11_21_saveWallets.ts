// @ts-nocheck
import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';

// Migrate walletAddress from the scout table to the scoutWallet table
async function query() {
  const users = await prisma.scout.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    where: {
      farcasterId: {
        not: null
      }
    },
    include: { scoutWallet: true }
  });

  for (const user of users) {
    const farcasterProfile = await getFarcasterUserById(user.farcasterId);
    // console.log('farcasterProfile', farcasterProfile?.verifications);
    const newWallets = farcasterProfile?.verifications.filter(
      (address) => !user.scoutWallet.some((w) => w.address === address)
    );
    if (newWallets.length > 0) {
      const existing = await prisma.scoutWallet.findMany({
        where: {
          address: { in: newWallets.map((address) => address.toLowerCase()) }
        }
      });
      if (existing.length > 0) {
        // safe to ignore, but interesting to know if this happens
        console.log('Wallet already exists', { user, existing, newWallets });
      }
      const newWalletsToCreate = newWallets.filter((address) => !existing.some((w) => w.address === address));
      if (newWalletsToCreate.length > 0) {
        // await prisma.scoutWallet.createMany({
        //   data: newWalletsToCreate.map((address) => ({ address: address.toLowerCase(), scoutId: user.id }))
        // });
        console.log('Created wallets', { userId: user.id, newWalletsToCreate });
      }
    }
    if (users.indexOf(user) % 10 === 0) {
      console.log(`Updated ${user.id} users. Latest createdAt: ${user.createdAt}`);
    }
  }

  console.log(`Migrated ${users.length} users`);
}

query();
