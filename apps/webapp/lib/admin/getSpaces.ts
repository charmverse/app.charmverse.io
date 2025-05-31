import type { Space, SpaceSubscriptionTier } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export type SpaceResult = Pick<
  Space,
  'id' | 'spaceImage' | 'name' | 'domain' | 'subscriptionTier' | 'subscriptionMonthlyPrice' | 'createdAt' | 'updatedAt'
>;

export type GetSpacesFilter = {
  subscriptionTier?: SpaceSubscriptionTier;
  hasSubscriptionMonthlyPrice?: boolean;
  name?: string;
};

export async function getSpaces(filter?: GetSpacesFilter): Promise<SpaceResult[]> {
  const where: any = {};

  if (filter?.subscriptionTier) {
    where.subscriptionTier = filter.subscriptionTier;
  }

  if (filter?.hasSubscriptionMonthlyPrice) {
    where.subscriptionMonthlyPrice = {
      not: null
    };
  }

  if (filter?.name) {
    where.name = {
      contains: filter.name,
      mode: 'insensitive'
    };
  }

  const spaces = await prisma.space.findMany({
    where,
    select: {
      id: true,
      spaceImage: true,
      name: true,
      domain: true,
      subscriptionTier: true,
      subscriptionMonthlyPrice: true,
      createdAt: true,
      updatedAt: true
    },
    orderBy: {
      createdAt: 'desc'
    },
    take: 100
  });

  return spaces;
}
