import { prisma } from '@charmverse/core/prisma-client';
import { getFarcasterUserById } from '@packages/farcaster/getFarcasterUserById';
import { getOnchainEvents } from '@packages/scoutgame/builderNfts/getOnchainPurchaseEvents';
import { uniq } from 'lodash';
import { DateTime } from 'luxon';

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

  // from block is somewhat arbitrary, but is early enough to grabs all events
  const events = await getOnchainEvents({ fromBlock: 126062456 });
  console.log(`Found ${events.length} onchain events`);

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
    if (users.indexOf(user) % 10 === 0) {
      console.log(`Updated ${users.indexOf(user)} users. Latest createdAt: ${user.createdAt}`);
    }
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
      console.log(`Updated ${users.indexOf(user)} users. Latest createdAt: ${user.createdAt.toISOString()}`);
    }
  }

  console.log(`Migrated ${users.length} users`);
}

async function saveUserWallets(userId: string, newWallets: string[]) {
  if (newWallets.length > 0) {
    const existing = await prisma.scoutWallet.findMany({
      where: {
        address: { in: newWallets.map((address) => address.toLowerCase()) }
      },
      include: {
        scout: {
          select: {
            nftPurchaseEvents: true,
            githubUsers: true
          }
        }
      }
    });
    const existingButUnused = existing.filter(
      (w) => w.scout.nftPurchaseEvents.length === 0 && w.scout.githubUser.length === 0
    );
    if (existingButUnused.length > 0) {
      console.log('Wallet already exists but is unused, so switch the ownership', {
        userId,
        originalOwners: existingButUnused.map((w) => w.scoutId + ': ' + w.address)
      });
      await prisma.scoutWallet.updateMany({
        where: { address: { in: existingButUnused.map((w) => w.address) } },
        data: {
          scoutId: userId
        }
      });
    }
    const existingAndUsed = existing.filter((w) => !existingButUnused.some((_w) => _w.address === w.address));
    if (existingAndUsed.length > 0) {
      // safe to ignore, but interesting to know if this happens
      console.log('Wallet has already been used by another user', {
        userId,
        existingAndUsed,
        newWallets: newWallets.length
      });
    }
    const newWalletsToCreate = newWallets.filter(
      (address) => !existing.some((w) => w.address === address.toLowerCase())
    );
    if (newWalletsToCreate.length > 0) {
      await prisma.scoutWallet.createMany({
        data: newWalletsToCreate.map((address) => ({ address: address.toLowerCase(), scoutId: userId }))
      });
      console.log('Created wallets', { userId: userId, newWalletsToCreate });
    }
  }
}

syncFarcasterWallets().catch((error) => {
  console.error('ERROR', error);
  process.exit(1);
});
//syncNFTWallets();
