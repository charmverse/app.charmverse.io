import type { GithubRepo, Prisma } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { bonusPartnersRecord } from '@packages/scoutgame/bonus';

export async function generateGithubRepos(totalGithubRepos: number): Promise<[GithubRepo[], Map<number, number>]> {
  const repoPRCounters = new Map<number, number>();

  await prisma.githubRepo.deleteMany({});

  const githubRepoIds = Array.from({ length: totalGithubRepos }, (_, i) => i + 1);

  const githubRepoCreateManyInput: Prisma.GithubRepoCreateManyInput[] = [];
  const githubRepos: GithubRepo[] = [];

  Array.from({ length: totalGithubRepos }, (_, i) => {
    const githubRepoCreateInput = {
      id: githubRepoIds[i],
      owner: faker.word
        .words({
          count: {
            max: 3,
            min: 1
          }
        })
        .split(' ')
        .join('-')
        .toLowerCase(),
      name: faker.internet.domainWord(),
      ownerType: 'org' as const,
      defaultBranch: 'main'
    };

    githubRepoCreateManyInput.push(githubRepoCreateInput);
    repoPRCounters.set(githubRepoIds[i], 0);
    githubRepos.push({
      ...githubRepoCreateInput,
      deletedAt: null,
      ownerType: 'org',
      handPicked: false,
      fork: false,
      createdAt: new Date(),
      bonusPartner: null
    });
  });

  await prisma.githubRepo.createMany({
    data: githubRepoCreateManyInput
  });

  for (const partner in bonusPartnersRecord) {
    const partnerRepos = bonusPartnersRecord[partner].repos;
    for (const repo of partnerRepos) {
      const [owner, name] = repo.split('/');
      if (name) {
        const githubRepo = await prisma.githubRepo.create({
          data: {
            id: githubRepos.length + 1,
            owner,
            ownerType: 'org',
            name,
            defaultBranch: 'main'
          }
        });
        githubRepos.push(githubRepo);
        repoPRCounters.set(githubRepo.id, 0);
      }
    }
  }

  return [githubRepos, repoPRCounters];
}
