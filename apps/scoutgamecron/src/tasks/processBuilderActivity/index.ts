import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, currentSeason, getDateFromISOWeek } from '@packages/scoutgame/dates';

import { processBuilderActivity } from './processBuilderActivity';
import { updateBuildersRank } from './updateBuildersRank';

type ProcessPullRequestsOptions = {
  createdAfter?: Date;
  season?: string;
};

export async function processAllBuilderActivity({
  createdAfter = new Date(Date.now() - 30 * 60 * 1000),
  season = currentSeason
}: ProcessPullRequestsOptions = {}) {
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved',
      builderNfts: {
        some: {
          season
        }
      }
    },
    // sort by id so that we can start mid-way if we need to
    orderBy: {
      id: 'asc'
    },
    select: {
      createdAt: true,
      id: true,
      githubUser: {
        select: {
          events: {
            take: 1,
            select: {
              id: true
            }
          },
          id: true,
          login: true
        }
      }
    }
  });

  log.info(`Processing activity for ${builders.length} builders`);

  for (const builder of builders) {
    // If the builder was created less than 10 minutes ago and has no existing events
    const newBuilder = builder.createdAt > new Date(Date.now() - 10 * 60 * 1000) && !builder.githubUser[0]?.events[0];

    await processBuilderActivity({
      builderId: builder.id,
      githubUser: builder.githubUser[0]!,
      createdAfter: newBuilder ? getDateFromISOWeek(season).toJSDate() : createdAfter,
      season
    });

    if (builders.indexOf(builder) % 10 === 0) {
      log.debug(`Processed ${builders.indexOf(builder)}/${builders.length} builders.`, {
        lastId: builder.id, // log last id in case we want to start in the middle of the process
        builders: builders
          .slice(builders.indexOf(builder), builders.indexOf(builder) + 10)
          .map((b) => b.githubUser[0].login)
      });
    }
  }

  await updateBuildersRank({ week: getCurrentWeek() });
}
