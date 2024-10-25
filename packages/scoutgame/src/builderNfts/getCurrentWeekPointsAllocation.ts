import { InvalidInputError } from '@charmverse/core/errors';
import { prisma } from '@charmverse/core/prisma-client';

export const pointsPerActiveBuilder = 2_500;

export async function getCurrentWeekPointsAllocation({ week }: { week: string }) {
  if (typeof week !== 'string' || !week.match(/^\d{4}-W\d{2}$/)) {
    throw new InvalidInputError('Invalid week format');
  }

  const activeBuilders = await prisma.userWeeklyStats.count({
    where: {
      week,
      user: {
        builderStatus: 'approved'
      },
      gemsCollected: {
        gt: 0
      }
    }
  });

  return activeBuilders * pointsPerActiveBuilder;
}
