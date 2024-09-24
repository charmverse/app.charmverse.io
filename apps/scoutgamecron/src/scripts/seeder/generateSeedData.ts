import { log } from '@charmverse/core/log';
import type { BuilderNft, GithubRepo, GithubUser, Scout } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';

import { generateBuilderEvents } from './generateBuilderEvents';
import { generateGithubRepos } from './generateGithubRepos';
import { generateNftPurchaseEvents } from './generateNftPurchaseEvents';
import { generateScout } from './generateScout';

async function generateBuilder() {
  const { scout, githubUser, builderNft } = await generateScout({ isBuilder: true });

  return {
    builder: scout,
    githubUser: githubUser as GithubUser,
    builderNft: builderNft as Omit<BuilderNft, 'builderId' | 'createdAt' | 'currentPrice'>
  };
}

function assignReposToBuilder(githubRepos: GithubRepo[]): GithubRepo[] {
  const repoCount = faker.number.int({ min: 3, max: 5 });
  return faker.helpers.arrayElements(githubRepos, repoCount);
}

function assignBuildersToScout(builders: {id: string, builderNftId: string}[]) {
  const builderCount = faker.number.int({ min: 3, max: 5 });
  return faker.helpers.arrayElements(builders, builderCount);
}

export async function generateSeedData() {
  // Total number of users
  const totalUsers = 200;
  // Total number of users that are builders (should be less than totalUsers)
  const totalBuilders = 100;
  // Total number of github repos
  const totalGithubRepos = 100;

  const [githubRepos, repoPRCounters] = await generateGithubRepos(totalGithubRepos);

  const builders: {id: string, builderNftId: string}[] = [];

  for (let i = 0; i < totalBuilders; i++) {
    const { githubUser, builder, builderNft } = await generateBuilder();
    // Realistically a builder will only send PR to a few repos not any arbitrary ones
    const assignedRepos = assignReposToBuilder(githubRepos);
    await generateBuilderEvents(githubUser, assignedRepos, repoPRCounters);
    builders.push({
      id: builder.id,
      builderNftId: builderNft.id
    });
  }

  for (let i = 0; i < totalUsers - totalBuilders; i++) {
    const { scout } = await generateScout();
    // Realistically a scout will only scout a few builders, by purchasing multiple of their nfts
    const assignedBuilders = assignBuildersToScout(builders);
    await generateNftPurchaseEvents(scout, assignedBuilders.map(builder => ({
      id: builder.id,
      builderNftId: builder.builderNftId
    })));
  }

  log.info('generated seed data', {
    totalUsers,
    totalBuilders,
    totalGithubRepos
  });
}
