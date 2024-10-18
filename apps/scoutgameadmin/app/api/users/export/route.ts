import { prisma } from '@charmverse/core/prisma-client';
import { stringify } from 'csv-stringify/sync';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type ScoutWithGithubUser = {
  id: string;
  username: string;
  createdAt: string;
  // avatar: string;
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

export async function GET(req: NextRequest) {
  const users = await prisma.scout.findMany({
    select: {
      id: true,
      username: true,
      createdAt: true,
      avatar: true,
      builderStatus: true,
      farcasterId: true,
      farcasterName: true,
      currentBalance: true,
      githubUser: true,
      userSeasonStats: true,
      userWeeklyStats: true
    }
  });
  const rows: ScoutWithGithubUser[] = users.map((user) => ({
    id: user.id,
    username: user.username,
    createdAt: user.createdAt.toDateString(),
    // avatar: user.avatar || '',
    builderStatus: user.builderStatus || undefined,
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
  const exportString = stringify(rows, { header: true, columns: Object.keys(rows[0]) });

  return new Response(exportString, {
    status: 200,
    headers: {
      'Content-Type': 'text/tsv',
      'Content-Disposition': 'attachment; filename=scout_users_export.tsv'
    }
  });
}
