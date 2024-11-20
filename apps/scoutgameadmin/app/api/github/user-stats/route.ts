import type { BuilderStrike, GithubEvent } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCommitsByUser } from '@packages/github/getCommitsByUser';
import { DateTime } from 'luxon';
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';

type Commit = {
  url: string;
  date: string;
  repo: string;
  title: string;
};

export type GithubUserStats = {
  afterDate: string;
  commits: number;
  builderStrikes: (Pick<BuilderStrike, 'id' | 'deletedAt' | 'createdAt'> & { githubEvent: GithubEvent })[];
  lastCommit?: Commit;
};

const afterDate = DateTime.utc().minus({ months: 3 }).toJSDate();

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const login = searchParams.get('login');
  if (!login || login.length < 2) {
    return NextResponse.json({ commits: 0 });
  }
  try {
    const builderStrikes = await prisma.builderStrike.findMany({
      where: {
        builder: {
          githubUser: {
            some: {
              login
            }
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      select: {
        id: true,
        createdAt: true,
        deletedAt: true,
        githubEvent: {
          include: {
            repo: true
          }
        }
      }
    });
    const commits = await getCommitsByUser({ login, after: afterDate, paginated: true });
    const lastCommit = commits[0];
    const result: GithubUserStats = {
      afterDate: afterDate.toISOString(),
      commits: commits.length,
      builderStrikes,
      lastCommit: lastCommit
        ? {
            url: lastCommit.html_url,
            title: lastCommit.commit.message,
            date: lastCommit.commit.author.date,
            repo: lastCommit.repository.full_name
          }
        : undefined
    };
    return NextResponse.json(result);
  } catch (error) {
    if ((error as Error).message?.includes('HTTP error! status: 404')) {
      return NextResponse.json({ message: 'User not found' }, { status: 404 });
    }
    return NextResponse.json({ message: (error as Error).message || 'Something went wrong' }, { status: 500 });
  }
}
