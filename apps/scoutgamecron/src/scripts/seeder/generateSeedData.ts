import { log } from '@charmverse/core/log';
import type { GithubRepo, GithubUser } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { claimPoints } from '@packages/scoutgame/points/claimPoints';
import { getWeekFromDate, currentSeason } from '@packages/scoutgame/dates';
import { getBuildersLeaderboard } from '@packages/scoutgame/getBuildersLeaderboard';
import { DateTime } from 'luxon';

import { processScoutPointsPayout } from '../../tasks/processGemsPayout/processScoutPointsPayout';
import { updateBuildersRank } from '../../tasks/processBuilderActivity/updateBuildersRank';

import { generateBuilder } from './generateBuilder';
import { generateBuilderEvents } from './generateBuilderEvents';
import { generateGithubRepos } from './generateGithubRepos';
import { generateNftPurchaseEvents } from './generateNftPurchaseEvents';
import { generateScout } from './generateScout';

export type BuilderInfo = {
  id: string;
  builderNftId?: string;
  nftPrice?: number;
  assignedRepos: GithubRepo[];
  githubUser: Pick<GithubUser, 'id' | 'login'>;
};

function assignReposToBuilder(githubRepos: GithubRepo[]): GithubRepo[] {
  const repoCount = faker.number.int({ min: 3, max: 5 });
  return faker.helpers.arrayElements(githubRepos, repoCount);
}

function assignBuildersToScout(builders: BuilderInfo[]) {
  const builderCount = faker.number.int({ min: 3, max: 5 });
  return faker.helpers.arrayElements(
    builders.filter((builder) => builder.builderNftId),
    builderCount
  );
}

export async function generateSeedData() {
  // Total number of users that are builders (should be less than totalUsers)
  const totalBuilders = faker.number.int({ min: 50, max: 100 });
  // Total number of github repos
  const totalGithubRepos = faker.number.int({ min: 25, max: 50 });

  const totalScoutBuilders = faker.number.int({ min: 5, max: 15 });

  const totalScouts = faker.number.int({ min: 50, max: 100 });

  const totalUsers = totalBuilders + totalScouts + totalScoutBuilders;

  const [githubRepos, repoPRCounters] = await generateGithubRepos(totalGithubRepos);

  const builders: BuilderInfo[] = [];
  const scouts: { id: string; assignedBuilders: BuilderInfo[] }[] = [];

  let totalGithubEvents = 0;
  let totalNftsPurchasedEvents = 0;

  const builderPromises = Array.from({ length: totalBuilders + totalScoutBuilders }, async (_, i) => {
    const { githubUser, builder, builderNft } = await generateBuilder({ index: i });
    const assignedRepos = assignReposToBuilder(githubRepos);
    const isScout = i >= totalBuilders;

    const builderInfo: BuilderInfo = {
      id: builder.id,
      builderNftId: builderNft?.id,
      nftPrice: builderNft?.currentPrice ? Number(builderNft.currentPrice) : undefined,
      assignedRepos,
      githubUser
    };

    return { builderInfo, isScout };
  });

  const builderResults = await Promise.all(builderPromises);

  // Process the results
  for (const { builderInfo, isScout } of builderResults) {
    builders.push(builderInfo);

    if (isScout) {
      const assignedBuilders = assignBuildersToScout(builders);
      scouts.push({
        id: builderInfo.id,
        assignedBuilders
      });
    }
  }

  for (let i = 0; i < totalScouts; i++) {
    const scout = await generateScout({ index: i + totalBuilders });
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

  const userIds = Array.from(new Set([...builders.map((builder) => builder.id), ...scouts.map((scout) => scout.id)]));

  for (let i = 0; i < days; i++) {
    const date = startDate.plus({ days: i });
    const week = getWeekFromDate(date.toJSDate());

    for (const builder of builders) {
      const dailyGithubEvents = await generateBuilderEvents(
        {
          builderId: builder.id,
          githubUser: builder.githubUser,
          githubRepos: builder.assignedRepos,
          repoPRCounters,
          date
        }
      );
      totalGithubEvents += dailyGithubEvents;
    }

    await updateBuildersRank({ week });

    for (const scout of scouts) {
      // Do not purchase your own nft
      const dailyNftsPurchased = await generateNftPurchaseEvents(
        scout.id,
        scout.assignedBuilders.filter((builder) => builder.id !== scout.id),
        date
      );
      totalNftsPurchasedEvents += dailyNftsPurchased;
    }

    // Check if we are at the end of the week
    if (date.weekday === 7) {
      const topWeeklyBuilders = await getBuildersLeaderboard({ quantity: 100, week });
      for (const { builder, gemsCollected, rank } of topWeeklyBuilders) {
        try {
          await processScoutPointsPayout({
            builderId: builder.id,
            rank,
            gemsCollected,
            week,
            season: currentSeason,
            createdAt: date.toJSDate()
          });
        } catch (error) {
          log.error(`Error processing scout points payout for builder ${builder.id}: ${error}`);
        }
      }
      // Randomly pick 50-75% of users to claim their weekly points immediately, other users will claim on next cron run
      const usersToClaim = faker.number.int({
        min: Math.floor(userIds.length * 0.5),
        max: Math.floor(userIds.length * 0.75)
      });
      const newUserIds = faker.helpers.shuffle(userIds).slice(0, usersToClaim);

      for (const user of newUserIds) {
        try {
          await claimPoints({ userId: user });
        } catch (error) {
          log.error(`Error claiming points for user ${user}: ${error}`);
        }
      }
    }
  }

  log.info('generated seed data', {
    totalUsers,
    totalBuilders,
    totalScoutBuilders,
    totalScouts,
    totalGithubRepos: githubRepos.length,
    totalGithubEvents,
    totalNftsPurchasedEvents
  });
}
