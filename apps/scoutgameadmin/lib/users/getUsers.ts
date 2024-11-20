import type { BuilderStatus, Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { validate } from 'uuid';

export type ScoutGameUser = Pick<
  Scout,
  | 'builderStatus'
  | 'path'
  | 'id'
  | 'avatar'
  | 'displayName'
  | 'createdAt'
  | 'farcasterName'
  | 'currentBalance'
  | 'email'
  | 'farcasterId'
> & { githubLogin: string | null; nftsPurchased: number; wallets: string[] };

export type SortField = 'displayName' | 'builderStatus' | 'currentBalance' | 'nftsPurchased' | 'createdAt';
export type SortOrder = 'asc' | 'desc';

export async function getUsers({
  searchString,
  sortField,
  sortOrder,
  builderStatus
}: {
  searchString?: string;
  sortField?: SortField;
  sortOrder?: SortOrder;
  builderStatus?: BuilderStatus;
} = {}): Promise<ScoutGameUser[]> {
  if (typeof searchString === 'string' && searchString.length < 2) {
    return [];
  }
  // assume farcaster id if search string is a number
  const userFid = getNumberFromString(searchString);
  const isScoutId = validate(searchString || '');
  const users = await prisma.scout.findMany({
    take: sortField === 'nftsPurchased' ? 1000 : 500, // return more for nft sort since we sort in the frontend
    orderBy:
      !userFid && typeof searchString === 'string'
        ? {
            _relevance: {
              fields: ['path', 'displayName', 'farcasterName', 'email', 'id'],
              search: `*${searchString}:*`,
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
      : isScoutId
        ? { id: searchString }
        : typeof searchString === 'string'
          ? {
              OR: [
                {
                  path: {
                    search: `*${searchString}:*`,
                    mode: 'insensitive'
                  }
                },
                {
                  displayName: {
                    search: `*${searchString}:*`,
                    mode: 'insensitive'
                  }
                },
                {
                  farcasterName: {
                    search: `*${searchString}:*`,
                    mode: 'insensitive'
                  }
                },
                {
                  githubUser: {
                    some: {
                      login: {
                        search: `*${searchString}:*`,
                        mode: 'insensitive'
                      }
                    }
                  }
                },
                {
                  email: {
                    startsWith: searchString,
                    mode: 'insensitive'
                  }
                }
              ]
            }
          : { builderStatus },
    include: {
      githubUser: true,
      userSeasonStats: true,
      scoutWallet: true
    }
  });
  return users.map(({ githubUser, userSeasonStats, scoutWallet, ...user }) => ({
    ...user,
    githubLogin: githubUser[0]?.login || null,
    nftsPurchased: userSeasonStats.find(({ season }) => season === '2024-W41')?.nftsPurchased || 0,
    wallets: scoutWallet.map((wallet) => wallet.address)
  }));
}

export function getNumberFromString(searchString?: string) {
  const userFidRaw = parseInt(searchString ?? '', 10);
  const isEqualToItself = searchString === userFidRaw.toString(); // uuids like "055f1650-517b-484e-a1c0-c050ef5aae4a" can sometimes return a number, which we don't want
  return Number.isNaN(userFidRaw) || !isEqualToItself ? undefined : userFidRaw;
}
