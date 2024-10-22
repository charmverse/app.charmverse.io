import { prisma } from '@charmverse/core/prisma-client';

export type Repo = {
  createdAt: string;
  deletedAt: string | null;
  id: number;
  name: string;
  owner: string;
  commits: number;
  prs: number;
  closedPrs: number;
  contributors: number;
  bonusPartner: string | null;
};

export async function getRepos({ searchString }: { searchString?: string } = {}): Promise<Repo[]> {
  if (typeof searchString === 'string' && searchString.length < 2) {
    return [];
  }

  const repos = await prisma.githubRepo.findMany({
    take: 500,
    orderBy:
      typeof searchString === 'string'
        ? [
            {
              _relevance: {
                fields: ['owner'],
                search: searchString,
                sort: 'desc'
              }
            },
            { createdAt: 'desc' },
            { name: 'asc' }
          ]
        : undefined,
    where:
      typeof searchString === 'string'
        ? {
            owner: {
              contains: searchString,
              mode: 'insensitive'
            }
          }
        : {
            OR: [
              {
                events: {
                  some: {
                    githubUser: {
                      builderId: {
                        not: null
                      }
                    }
                  }
                }
              },
              {
                bonusPartner: {
                  not: null
                }
              }
            ]
          },
    include: {
      events: true
    }
  });
  return repos.map((repo) => ({
    createdAt: repo.createdAt.toISOString(),
    deletedAt: repo.deletedAt?.toISOString() ?? null,
    id: repo.id,
    name: repo.name,
    owner: repo.owner,
    commits: repo.events.filter((event) => event.type === 'commit').length,
    prs: repo.events.filter((event) => event.type === 'merged_pull_request').length,
    closedPrs: repo.events.filter((event) => event.type === 'closed_pull_request').length,
    contributors: new Set(repo.events.map((event) => event.createdBy)).size,
    bonusPartner: repo.bonusPartner
  }));
}
