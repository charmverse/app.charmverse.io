import { prisma } from '@charmverse/core/prisma-client';
import { getReposByOwner } from '@packages/github/getReposByOwner';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

export type RepoSearchResult = {
  id: number;
  url: string;
  fullName: string;
  exists: boolean;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const owner = searchParams.get('owner');
  if (!owner || owner.length < 2) {
    return NextResponse.json([]);
  }
  try {
    const repos = await getReposByOwner(owner);
    const existing = await prisma.githubRepo.findMany({
      where: {
        id: {
          in: repos.map((repo) => repo.id)
        }
      }
    });
    const result: RepoSearchResult[] = repos.map((repo) => ({
      id: repo.id,
      fullName: repo.full_name,
      url: repo.html_url,
      exists: existing.some((e) => e.id === repo.id)
    }));
    return NextResponse.json(result);
  } catch (error) {
    if ((error as Error).message?.includes('HTTP error! status: 404')) {
      return NextResponse.json({ message: 'Repository owner not found' }, { status: 404 });
    }
    return NextResponse.json({ message: (error as Error).message || 'Something went wrong' }, { status: 500 });
  }
}
