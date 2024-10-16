import { prisma } from '@charmverse/core/prisma-client';
import { stringify } from 'csv-stringify/sync';
import type { NextRequest } from 'next/server';

export const dynamic = 'force-dynamic';

type ScoutWithGithubUser = {
  id: string;
  username: string;
  // avatar: string;
  builderStatus: string;
  githubLogin?: string;
  fid?: number;
  farcasterName?: string;
  currentBalance: number;
};

export async function GET(req: NextRequest) {
  const users = await prisma.scout.findMany({
    select: {
      id: true,
      username: true,
      avatar: true,
      builderStatus: true,
      farcasterId: true,
      farcasterName: true,
      currentBalance: true,
      githubUser: true
    }
  });
  const rows: ScoutWithGithubUser[] = users.map((user) => ({
    id: user.id,
    username: user.username,
    // avatar: user.avatar || '',
    builderStatus: user.builderStatus || '',
    githubLogin: user.githubUser[0]?.login,
    fid: user.farcasterId || undefined,
    farcasterName: user.farcasterName || undefined,
    currentBalance: user.currentBalance
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
