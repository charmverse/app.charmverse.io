import { log } from '@charmverse/core/log';
import type { BuilderNft, GithubRepo, GithubUser } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';

import { generateBuilderEvents } from './generateBuilderEvents';
import { generateGithubRepos } from './generateGithubRepos';
import { generateNftPurchaseEvents } from './generateNftPurchaseEvents';
import { generateScout } from './generateScout';
import { DateTime } from 'luxon';
import { getTopBuilders } from '@packages/scoutgame/getTopBuilders';
import { getFormattedWeek } from '@packages/scoutgame/utils';
import { processScoutPointsPayout } from '../../tasks/processGemsPayout/processScoutPointsPayout';

export type BuilderInfo = {
  id: string;
  builderNftId: string;
  nftPrice: number;
  assignedRepos: GithubRepo[];
  githubUser: Pick<GithubUser, 'id' | 'login'>;
}

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
  const scouts: {id: string, assignedBuilders: BuilderInfo[]}[] = [];

  let totalGithubEvents = 0, totalNftsPurchasedEvents = 0;

  for (let i = 0; i < totalBuilders + totalScoutBuilders; i++) {
    const { githubUser, builder, builderNft } = await generateBuilder();
    const assignedRepos = assignReposToBuilder(githubRepos);
    const isScout = i >= totalBuilders;
    builders.push({
      id: builder.id,
      builderNftId: builderNft.id,
      nftPrice: builderNft.currentPrice,
      assignedRepos,
      githubUser,
    });

    if (isScout) {
      const assignedBuilders = assignBuildersToScout(builders);
      scouts.push({
        id: builder.id,
        assignedBuilders
      });
    }
  }

  for (let i = 0; i < totalScouts; i++) {
    const { scout } = await generateScout();
    // Realistically a scout will only scout a few builders, by purchasing multiple of their nfts
    const assignedBuilders = assignBuildersToScout(builders);
    scouts.push({
      id: scout.id,
      assignedBuilders
    });
  }

  // Go through each day of the past two weeks
  const startDate = DateTime.now().minus({ weeks: 2 });
  const endDate = DateTime.now();

  const days = endDate.diff(startDate, 'days').days;

  for (let i = 0; i < days; i++) {
    const date = startDate.plus({ days: i });
    const week = getFormattedWeek(date.toJSDate());

    for (const builder of builders) {
      let dailyGithubEvents = await generateBuilderEvents(
        builder.githubUser,
        builder.assignedRepos,
        repoPRCounters,
        date
      )
      totalGithubEvents += dailyGithubEvents;
    }

    for (const scout of scouts) {
      // Do not purchase your own nft
      let dailyNftsPurchased = await generateNftPurchaseEvents(scout.id, scout.assignedBuilders.filter(builder => builder.id !== scout.id), date);
      totalNftsPurchasedEvents += dailyNftsPurchased;
    }

    // Check if we are at the end of the week
    if (date.weekday === 7) {
      const topWeeklyBuilders = await getTopBuilders({ quantity: 100, week });
      for (const { builder, gemsCollected, rank } of topWeeklyBuilders) {
        try {
          await processScoutPointsPayout({ builderId: builder.id, rank, gemsCollected, week });
        } catch (error) {
          log.error(`Error processing scout points payout for builder ${builder.id}: ${error}`);
        }
      }
    }
  }

  log.info('generated seed data', {
    totalUsers,
    totalBuilders,
    totalScoutBuilders,
    totalScouts,
    totalGithubRepos,
    totalGithubEvents,
    totalNftsPurchasedEvents
  });
}
