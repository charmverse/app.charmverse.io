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
    builderNft: builderNft as Omit<BuilderNft, 'builderId' | 'createdAt' | 'currentPrice'> & {
      currentPrice: number
    }
  };
}

type BuilderInfo = {
  id: string;
  builderNftId: string;
  nftPrice: number;
}

function assignReposToBuilder(githubRepos: GithubRepo[]): GithubRepo[] {
  const repoCount = faker.number.int({ min: 3, max: 5 });
  return faker.helpers.arrayElements(githubRepos, repoCount);
}

function assignBuildersToScout(builders: BuilderInfo[]) {
  const builderCount = faker.number.int({ min: 3, max: 5 });
  return faker.helpers.arrayElements(builders, builderCount);
}

export async function generateSeedData() {
  // Total number of users that are builders (should be less than totalUsers)
  const totalBuilders = faker.number.int({ min: 100, max: 150 });
  // Total number of github repos
  const totalGithubRepos = faker.number.int({ min: 50, max: 100 });

  const totalScoutBuilders = faker.number.int({min: 25, max: 50});

  const totalScouts = faker.number.int({ min: 150, max: 250 });

  const totalUsers = totalBuilders + totalScouts + totalScoutBuilders;

  const [githubRepos, repoPRCounters] = await generateGithubRepos(totalGithubRepos);

  const builders: BuilderInfo[] = [];
  const scoutBuilders: BuilderInfo[] = [];

  for (let i = 0; i < totalBuilders; i++) {
    const { githubUser, builder, builderNft } = await generateBuilder();
    // Realistically a builder will only send PR to a few repos not any arbitrary ones
    const assignedRepos = assignReposToBuilder(githubRepos);
    await generateBuilderEvents(githubUser, assignedRepos, repoPRCounters);
    builders.push({
      id: builder.id,
      builderNftId: builderNft.id,
      nftPrice: builderNft.currentPrice
    });
  }

  for (let i = 0; i < totalScoutBuilders; i++) {
    const { githubUser, builder, builderNft } = await generateBuilder();
    const assignedRepos = assignReposToBuilder(githubRepos);
    await generateBuilderEvents(githubUser, assignedRepos, repoPRCounters);
    scoutBuilders.push({
      id: builder.id,
      builderNftId: builderNft.id,
      nftPrice: builderNft.currentPrice
    });
  }

  for (let i = 0; i < totalScouts; i++) {
    const { scout } = await generateScout();
    // Realistically a scout will only scout a few builders, by purchasing multiple of their nfts
    const assignedBuilders = assignBuildersToScout(builders);
    await generateNftPurchaseEvents(scout.id, assignedBuilders.map(builder => ({
      id: builder.id,
      builderNftId: builder.builderNftId,
      nftPrice: builder.nftPrice
    })));
  }

  for (let i = 0; i < totalScoutBuilders; i++) {
    const scoutBuilder = scoutBuilders[i];
    const assignedBuilders = assignBuildersToScout(builders);
    // Do not purchase your own nft
    await generateNftPurchaseEvents(scoutBuilder.id, assignedBuilders.map(builder => ({
      id: builder.id,
      builderNftId: builder.builderNftId,
      nftPrice: builder.nftPrice
    })).filter(builder => builder.id !== scoutBuilder.id));
  }

  log.info('generated seed data', {
    totalUsers,
    totalBuilders,
    totalScoutBuilders,
    totalScouts,
    totalGithubRepos
  });
}
