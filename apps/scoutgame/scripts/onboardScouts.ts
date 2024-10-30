import { prisma } from '@charmverse/core/prisma-client';
import { findOrCreateFarcasterUser } from 'lib/farcaster/findOrCreateFarcasterUser';
import type { ConnectWaitlistTier } from '@packages/scoutgame/waitlist/scoring/constants';

async function onboardScouts({ fids, tierOverride }: { fids: number[]; tierOverride?: ConnectWaitlistTier }) {
  const existingAccounts = await prisma.scout.findMany({
    where: {
      farcasterId: {
        in: fids
      }
    }
  });

  console.log(`Found ${existingAccounts.length} existing accounts`);

  const fidsRequiringAccount = fids.filter((fid) => !existingAccounts.some((account) => account.farcasterId === fid));
  const totalFidsToProcess = fidsRequiringAccount.length;

  for (let i = 0; i < totalFidsToProcess; i++) {
    const fid = fidsRequiringAccount[i];
    console.log(`Creating user ${i + 1} / ${totalFidsToProcess}`);
    const user = await findOrCreateFarcasterUser({ fid, tierOverride: 'mythic' });
    // console.log(`Created user ${user.id}. View: https://scoutgame.xyz/u/${user.path}`);
  }
}

async function script() {
  await onboardScouts({ fids: [5516], tierOverride: 'mythic' });
}

script();
