import type { Space, SpaceSubscriptionTier } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';

export type SpaceResult = Pick<
  Space,
  'id' | 'spaceImage' | 'name' | 'domain' | 'subscriptionTier' | 'subscriptionMonthlyPrice' | 'createdAt' | 'updatedAt'
>;

export type GetSpacesFilter = {
  subscriptionTier?: SpaceSubscriptionTier;
  name?: string;
  sortField?: string;
  sortDirection?: 'asc' | 'desc';
};

export async function getSpaces(filter?: GetSpacesFilter): Promise<{
  spaces: SpaceResult[];
  totalCount: number;
}> {
  const where: any = {};
  const orderBy: any = {};

  if (filter?.subscriptionTier) {
    where.subscriptionTier = filter.subscriptionTier;
  }

  if (filter?.name) {
    where.name = {
      contains: filter.name,
      mode: 'insensitive'
    };
  } else if (filter?.sortField) {
    orderBy[filter.sortField] = filter.sortDirection;
    if (filter.sortField === 'subscriptionMonthlyPrice') {
      where.subscriptionMonthlyPrice = {
        not: null
      };
    }
  } else {
    orderBy.createdAt = 'desc';
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
    orderBy,
    take: 100
  });

  return spaces;
}
