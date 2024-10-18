import type { Scout } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

export type ScoutGameUser = Pick<Scout, 'builderStatus' | 'username' | 'id' | 'avatar' | 'displayName' | 'createdAt'>;

export type UserFilter = 'only-builders';

export async function getUsers({ searchString, filter }: { searchString?: string; filter?: UserFilter } = {}): Promise<
  ScoutGameUser[]
> {
  if (typeof searchString === 'string' && searchString.length < 2) {
    return [];
  }
  // assume farcaster id if search string is a number
  const userFidRaw = parseInt(searchString ?? '', 10);
  const userFid = Number.isNaN(userFidRaw) ? undefined : userFidRaw;

  const users = await prisma.scout.findMany({
    take: 500,
    orderBy:
      !userFid && typeof searchString === 'string'
        ? {
            _relevance: {
              fields: ['username', 'walletAddress', 'displayName', 'email'],
              search: searchString,
              sort: 'desc'
            }
          }
        : { createdAt: 'desc' },
    where: userFid
      ? { farcasterId: userFid }
      : typeof searchString === 'string'
        ? {
            username: {
              contains: searchString,
              mode: 'insensitive'
            }
          }
        : filter === 'only-builders'
          ? { builderStatus: { not: null } }
          : undefined
  });
  return users;
}
