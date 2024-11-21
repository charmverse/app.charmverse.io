import type { BuilderStatus } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';

import { currentSeason } from '../dates';
import { BasicUserInfoSelect } from '../users/queries';

import type { BasicUserInfo } from './interfaces';

export async function getUserByPath(path: string): Promise<
  | (BasicUserInfo & {
      nftImageUrl?: string;
      congratsImageUrl?: string | null;
      builderStatus: BuilderStatus | null;
      displayName: string;
      talent: {
        id: string;
        score: number;
      } | null;
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
      farcasterName: true,
      talentProfile: {
        select: {
          id: true,
          score: true
        }
      }
    }
  });

  if (!user) {
    return null;
  }

  return {
    ...user,
    nftImageUrl: user?.builderNfts[0]?.imageUrl,
    congratsImageUrl: user?.builderNfts[0]?.congratsImageUrl,
    githubLogin: user?.githubUser[0]?.login,
    talent: user.talentProfile
  };
}
