import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, currentSeason } from '@packages/scoutgame/dates';

import { processBuilderActivity } from './processBuilderActivity';
import { updateBuildersRank } from './updateBuildersRank';

type ProcessPullRequestsOptions = {
  createdAfter?: Date;
  skipClosedPrProcessing?: boolean;
  season?: string;
};

export async function processRecentBuilderActivity({
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
    orderBy: {
      id: 'asc'
    },
    select: {
      id: true,
      githubUser: {
        select: {
          id: true,
          login: true
        }
      }
    }
  });

  log.info(`Found ${builders.length} builders to check for PRs`);

  for (const builder of builders) {
    await processBuilderActivity({
      builderId: builder.id,
      githubUser: builder.githubUser[0]!,
      createdAfter,
      season
    });
    if (builders.indexOf(builder) % 10 === 0) {
      log.debug(`Processed ${builders.indexOf(builder)}/${builders.length} builders. Last Id: ${builder.id}`, {
        builders: builders
          .slice(builders.indexOf(builder), builders.indexOf(builder) + 10)
          .map((b) => b.githubUser[0].login)
      });
    }
  }

  await updateBuildersRank({ week: getCurrentWeek() });
}
