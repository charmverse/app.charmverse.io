import { log } from '@charmverse/core/log';
import type { GithubRepo, GithubUser } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';

import { generateBuilderEvents } from './generateBuilderEvents';
import { generateGithubRepos } from './generateGithubRepos';
import { generateScout } from './generateScout';

async function generateBuilder() {
  const { scout, githubUser } = await generateScout({ isBuilder: true });

  return {
    builder: scout,
    githubUser: githubUser as GithubUser
  };
}

function assignReposToBuilder(githubRepos: GithubRepo[]): GithubRepo[] {
  const repoCount = faker.number.int({ min: 3, max: 5 });
  return faker.helpers.arrayElements(githubRepos, repoCount);
}

export async function generateSeedData() {
  // Total number of users
  const totalUsers = 200;
  // Total number of users that are builders (should be less than totalUsers)
  const totalBuilders = 100;
  // Total number of github repos
  const totalGithubRepos = 100;

  const [githubRepos, repoPRCounters] = await generateGithubRepos(totalGithubRepos);

  for (let i = 0; i < totalBuilders; i++) {
    const { githubUser } = await generateBuilder();
    // Realistically a builder will only send PR to a few repos not any arbitrary ones
    const assignedRepos = assignReposToBuilder(githubRepos);
    await generateBuilderEvents(githubUser, assignedRepos, repoPRCounters);
  }

  for (let i = 0; i < totalUsers - totalBuilders; i++) {
    await generateScout();
  }

  log.info('generated seed data', {
    totalUsers,
    totalBuilders,
    totalGithubRepos
  });
}
