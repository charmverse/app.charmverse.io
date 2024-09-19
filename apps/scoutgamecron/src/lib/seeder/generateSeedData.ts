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
  // Percentage of users that are builders
  const builderPercentage = faker.number.int({ min: 20, max: 50 });
  // Total number of users
  const totalUsers = faker.number.int({ min: 250, max: 500 });
  // Total number of builders
  const totalBuilders = Math.floor((totalUsers * builderPercentage) / 100);
  // Total number of github repos
  const totalGithubRepos = faker.number.int({ min: 100, max: 150 });

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
