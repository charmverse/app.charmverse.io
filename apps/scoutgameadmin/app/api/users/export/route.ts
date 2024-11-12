import { prisma } from '@charmverse/core/prisma-client';
import { currentSeason } from '@packages/scoutgame/dates';
import type { NextRequest } from 'next/server';

import { respondWithTSV } from 'lib/nextjs/respondWithTSV';

export const dynamic = 'force-dynamic';

type ScoutWithGithubUser = {
  id: string;
  path: string;
  createdAt: string;
  email?: string;
  tokenId?: number;
  optedInToMarketing?: string;
  builderStatus?: string;
  githubLogin?: string;
  fid?: number;
  farcasterName?: string;
  currentBalance: number;
  nftsPurchased: number;
  nftsSold: number;
  pointsEarnedAsScout: number;
  pointsEarnedAsBuilder: number;
  weeklyBuilderRank?: number;
};

export async function GET() {
  const users = await prisma.scout.findMany({
    select: {
      id: true,
      path: true,
      sendMarketing: true,
      createdAt: true,
      avatar: true,
      email: true,
      builderStatus: true,
      farcasterId: true,
      farcasterName: true,
      currentBalance: true,
      githubUser: true,
      userSeasonStats: true,
      userWeeklyStats: true,
      builderNfts: {
        where: {
          season: currentSeason
        }
      }
    }
  });
  const rows: ScoutWithGithubUser[] = users.map((user) => ({
    id: user.id,
    path: user.path!,
    createdAt: user.createdAt.toDateString(),
    email: user.email || undefined,
    optedInToMarketing: user.sendMarketing ? 'Yes' : '',
    // avatar: user.avatar || '',
    builderStatus: user.builderStatus || undefined,
    tokenId: user.builderNfts[0]?.tokenId || undefined,
    fid: user.farcasterId || undefined,
    farcasterName: user.farcasterName || undefined,
    githubLogin: user.githubUser[0]?.login,
    currentBalance: user.currentBalance,
    pointsEarnedAsScout: user.userSeasonStats[0]?.pointsEarnedAsScout || 0,
    pointsEarnedAsBuilder: user.userSeasonStats[0]?.pointsEarnedAsBuilder || 0,
    nftsPurchased: user.userSeasonStats[0]?.nftsPurchased || 0,
    nftsSold: user.userSeasonStats[0]?.nftsSold || 0,
    weeklyBuilderRank: user.userWeeklyStats[0]?.rank || undefined
  }));

  return respondWithTSV(rows, 'scout_users_export.tsv');
}
