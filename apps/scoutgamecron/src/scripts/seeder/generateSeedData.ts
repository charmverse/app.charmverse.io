import { log } from '@charmverse/core/log';
import { prisma, type GithubRepo, type GithubUser } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { claimPoints } from '@packages/scoutgame/points/claimPoints';
import { getWeekFromDate, currentSeason } from '@packages/scoutgame/dates';
import { getBuildersLeaderboard } from '@packages/scoutgame/builders/getBuildersLeaderboard';
import { DateTime } from 'luxon';
import { findOrCreateFarcasterUser } from '@packages/scoutgame/users/findOrCreateFarcasterUser';

import { processScoutPointsPayout } from '../../tasks/processGemsPayout/processScoutPointsPayout';
import { updateBuildersRank } from '@packages/scoutgame/builders/updateBuildersRank';

import { generateBuilder } from './generateBuilder';
import { generateBuilderEvents } from './generateBuilderEvents';
import { generateGithubRepos } from './generateGithubRepos';
import { generateNftPurchaseEvents } from './generateNftPurchaseEvents';
import { generateScout } from './generateScout';
import { updateBuilderCardActivity } from '../../tasks/updateBuilderCardActivity/updateBuilderCardActivity';

export type BuilderInfo = {
  id: string;
  builderNftId?: string;
  nftPrice?: number;
  assignedRepos: GithubRepo[];
  githubUsers: Pick<GithubUser, 'id' | 'login'>;
};

function assignReposToBuilder(githubRepos: GithubRepo[]): GithubRepo[] {
  const repoCount = faker.number.int({ min: 0, max: 3 });
  return faker.helpers.arrayElements(githubRepos, repoCount);
}

function assignBuildersToScout(builders: BuilderInfo[]) {
  const builderCount = faker.number.int({ min: 0, max: 5 });
  return faker.helpers.arrayElements(
    builders.filter((builder) => builder.builderNftId),
    builderCount
  );
}

type MinMaxRange = {
  min: number;
  max: number;
};

const defaultBuildersRange: MinMaxRange = {
  min: 10,
  max: 20
};

/**
 * @fidToGenerate - Utility for including your own user id in the generated data
 */
export async function generateSeedData(
  { buildersRange = defaultBuildersRange, includeFid }: { buildersRange?: MinMaxRange; includeFid?: number } = {
    buildersRange: defaultBuildersRange
  }
) {
  // Total number of users that are builders (should be less than totalUsers)
  const totalBuilders = faker.number.int(buildersRange);
  // Total number of github repos
  const totalGithubRepos = faker.number.int({ min: 5, max: 10 });

  const totalScouts = faker.number.int({ min: 10, max: 20 });

  const totalUsers = totalBuilders + totalScouts;

  const [githubRepos, repoPRCounters] = await generateGithubRepos(totalGithubRepos);

  const builders: BuilderInfo[] = [];
  const scouts: { id: string; assignedBuilders: BuilderInfo[] }[] = [];

  let totalGithubEvents = 0;
  let totalNftsPurchasedEvents = 0;

  const builderPromises = Array.from({ length: totalBuilders }, async (_, i) => {
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

  // Handle user account
  if (includeFid) {
    const scout = await findOrCreateFarcasterUser({
      fid: includeFid
    });

    const assignedToMe = assignBuildersToScout(builders);

    scouts.push({
      id: scout.id,
      assignedBuilders: assignedToMe
    });
  }

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

    await Promise.all(
      builders.map(async (builder) => {
        const dailyGithubEvents = await generateBuilderEvents({
          builderId: builder.id,
          githubUsers: builder.githubUser,
          githubRepos: builder.assignedRepos,
          repoPRCounters,
          date
        });
        totalGithubEvents += dailyGithubEvents;
      })
    );

    await Promise.all(
      scouts.map(async (scout) => {
        // Do not purchase your own nft
        const nfts = scout.assignedBuilders.filter((builder) => builder.id !== scout.id);
        const dailyNftsPurchased = await generateNftPurchaseEvents(scout.id, nfts, date);
        totalNftsPurchasedEvents += dailyNftsPurchased;
      })
    );

    await updateBuilderCardActivity(date.minus({ days: 1 }));

    // Check if we are at the end of the week
    if (date.weekday === 7) {
      await updateBuildersRank({ week });
      const topWeeklyBuilders = await getBuildersLeaderboard({ quantity: 100, week });
      for (const { builder, gemsCollected, rank } of topWeeklyBuilders) {
        try {
          await processScoutPointsPayout({
            builderId: builder.id,
            rank,
            gemsCollected,
            week,
            season: currentSeason,
            createdAt: date.toJSDate(),
            // We started with 100k points per week
            weeklyAllocatedPoints: 1e5
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

  await updateBuildersRank({ week: getWeekFromDate(endDate.toJSDate()) });

  log.info('generated seed data', {
    totalUsers,
    totalBuilders,
    totalScouts,
    totalGithubRepos: githubRepos.length,
    totalGithubEvents,
    totalNftsPurchasedEvents
  });
}

// generateSeedData({buildersRange: {max: 5, min: 5}, includeFid: 4339}).then(console.log)
