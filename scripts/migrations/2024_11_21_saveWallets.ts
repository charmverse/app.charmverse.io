import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import { getOnchainEvents } from '@packages/scoutgame/builderNfts/getOnchainPurchaseEvents';
import { uniq } from 'lodash';

// Save user wallets based on Farcaster profile and NFT purchases
async function syncNFTWallets() {
  const users = await prisma.scout.findMany({
    orderBy: {
      createdAt: 'desc'
    },
    where: {
      nftPurchaseEvents: {
        some: {}
      }
    },
    include: { scoutWallet: true }
  });
  console.log(`Found ${users.length} users with NFT purchases`);

  const events = await getOnchainEvents();
  console.log(`Found ${events.length} onchain events`);
  return;
  for (const user of users) {
    const walletsFromOnchain = uniq(
      events
        .filter((event) => event.scoutId === user.id)
        .map((event) => event.transferEvent.to)
        .filter(Boolean)
    );
    const newWallets = walletsFromOnchain.filter(
      (address) => !user.scoutWallet.some((w) => w.address === address.toLowerCase())
    );

    await saveUserWallets(user.id, newWallets);
  }
}

async function syncFarcasterWallets() {
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
  console.log(`Found ${users.length} users with Farcaster profiles`);

  for (const user of users) {
    const farcasterProfile = await getFarcasterUserById(user.farcasterId!);
    const newWallets = farcasterProfile?.verifications.filter(
      (address) => !user.scoutWallet.some((w) => w.address === address.toLowerCase())
    );

    await saveUserWallets(user.id, newWallets);

    if (users.indexOf(user) % 10 === 0) {
      console.log(`Updated ${user.id} users. Latest createdAt: ${user.createdAt}`);
    }
  }

  console.log(`Migrated ${users.length} users`);
}

async function saveUserWallets(userId: string, newWallets: string[]) {
  if (newWallets.length > 0) {
    const existing = await prisma.scoutWallet.findMany({
      where: {
        address: { in: newWallets.map((address) => address.toLowerCase()) }
      }
    });
    if (existing.length > 0) {
      // safe to ignore, but interesting to know if this happens
      console.log('Wallet already exists', { userId, existing, newWallets });
    }
    const newWalletsToCreate = newWallets.filter((address) => !existing.some((w) => w.address === address));
    if (newWalletsToCreate.length > 0) {
      await prisma.scoutWallet.createMany({
        data: newWalletsToCreate.map((address) => ({ address: address.toLowerCase(), scoutId: userId }))
      });
      console.log('Created wallets', { userId: userId, newWalletsToCreate });
    }
  }
}

//syncFarcasterWallets();
syncNFTWallets();
