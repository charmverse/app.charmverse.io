import { prisma } from '@charmverse/core/prisma-client';

import { waitlistTiers } from './calculateUserPosition';

export async function refreshPercentilesForEveryone() {
  const totalPercentiles = await prisma.connectWaitlistSlot.count();

  for (let i = 0; i < totalPercentiles; i++) {
    const offsetPer
  }
}
