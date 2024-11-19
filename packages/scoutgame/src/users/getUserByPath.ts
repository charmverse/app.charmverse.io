import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason } from '../dates';

import type { BasicUserInfo } from './interfaces';
import { BasicUserInfoSelect } from './queries';

export async function getUserByPath(path: string): Promise<
  | (BasicUserInfo & {
      nftImageUrl?: string;
      congratsImageUrl?: string | null;
      builderStatus: BuilderStatus | null;
      displayName: string;
    })
  | null
> {
  const user = await prisma.scout.findFirst({
    where: {
      path
    },
    select: {
      ...BasicUserInfoSelect,
      displayName: true,
      builderNfts: {
        where: {
          season: currentSeason
        }
      },
      farcasterName: true
    }
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    nftImageUrl: user?.builderNfts[0]?.imageUrl,
    congratsImageUrl: user?.builderNfts[0]?.congratsImageUrl,
    githubLogin: user?.githubUser[0]?.login
  };
}
