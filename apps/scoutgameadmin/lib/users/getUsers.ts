import type { Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type ScoutGameUser = Pick<
  Scout,
  'builderStatus' | 'path' | 'id' | 'avatar' | 'displayName' | 'createdAt' | 'farcasterId' | 'currentBalance'
> & { nftsPurchased: number };

export type UserFilter = 'only-builders';

export type SortField = 'path' | 'builderStatus' | 'currentBalance' | 'nftsPurchased' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export async function getUsers({
  searchString,
  filter,
  sortField,
  sortOrder
}: { searchString?: string; filter?: UserFilter; sortField?: SortField; sortOrder?: SortOrder } = {}): Promise<
  ScoutGameUser[]
> {
  if (typeof searchString === 'string' && searchString.length < 2) {
    return [];
  }
  // assume farcaster id if search string is a number
  const userFid = getNumberFromString(searchString);

  const users = await prisma.scout.findMany({
    take: sortField === 'nftsPurchased' ? 1000 : 500, // return more for nft sort since we sort in the frontend
    orderBy:
      !userFid && typeof searchString === 'string'
        ? {
            _relevance: {
              fields: ['path', 'walletAddress', 'displayName', 'email', 'id'],
              search: searchString,
              sort: 'desc'
            }
          }
        : sortField === 'nftsPurchased'
          ? {
              /*  TODO - sort by nfts purchased */
              createdAt: sortOrder || 'desc'
            }
          : sortField
            ? { [sortField]: sortOrder || 'asc' }
            : { createdAt: sortOrder || 'desc' },
    where: userFid
      ? { farcasterId: userFid }
      : typeof searchString === 'string'
        ? {
            path: {
              contains: searchString,
              mode: 'insensitive'
            }
          }
        : filter === 'only-builders'
          ? { builderStatus: { not: null } }
          : undefined,
    include: {
      userSeasonStats: true
    }
  });
  return users.map((user) => ({
    ...user,
    nftsPurchased: user.userSeasonStats.find(({ season }) => season === '2024-W41')?.nftsPurchased || 0
  }));
}

export function getNumberFromString(searchString?: string) {
  const userFidRaw = parseInt(searchString ?? '', 10);
  return Number.isNaN(userFidRaw) ? undefined : userFidRaw;
}
