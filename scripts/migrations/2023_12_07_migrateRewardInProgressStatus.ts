import { prisma } from '@charmverse/core/prisma-client';

export async function migrateRewardInProgressStatus() {
  const rewardsInProgress = await prisma.bounty.findMany({ where: { status: 'inProgress' } });

  console.log('🔥', 'Rewards in progress:', rewardsInProgress.length);

  await prisma.bounty.updateMany({ where: { status: 'inProgress' }, data: { status: 'open'} });
}

migrateRewardInProgressStatus();