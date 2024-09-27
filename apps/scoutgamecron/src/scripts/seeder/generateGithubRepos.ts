import type { GithubRepo } from '@charmverse/core/prisma';
import { prisma } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { bonusPartnersRecord } from '@packages/scoutgame/bonus';

export async function generateGithubRepos(totalGithubRepos: number): Promise<[GithubRepo[], Map<number, number>]> {
  const githubRepos: GithubRepo[] = [];
  const repoPRCounters = new Map<number, number>();

  for (let i = 0; i < totalGithubRepos; i++) {
    const githubRepo = await prisma.githubRepo.create({
      data: {
        id: i + 1,
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
        defaultBranch: 'main'
      }
    });
    githubRepos.push(githubRepo);
    repoPRCounters.set(githubRepo.id, 0);
  }

  for (const partner in bonusPartnersRecord) {
    const partnerRepos = bonusPartnersRecord[partner].repos;
    for (const repo of partnerRepos) {
      const [owner, name] = repo.split('/');
      if (name) {
        const githubRepo = await prisma.githubRepo.create({
          data: {
            id: githubRepos.length + 1,
            owner,
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
