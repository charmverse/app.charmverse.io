import { processAllBuilderActivity } from '../tasks/processBuilderActivity';
import { processBuilderActivity } from '../tasks/processBuilderActivity/processBuilderActivity';
import { getBuilderActivity } from '../tasks/processBuilderActivity/getBuilderActivity';
import { DateTime } from 'luxon';
import { getCurrentWeek, currentSeason } from '@packages/scoutgame/dates';
import { prisma } from '@charmverse/core/prisma-client';

const windowStart = DateTime.fromISO('2024-10-28', { zone: 'utc' }).toJSDate();

(async () => {
  // const events = await prisma.builderEvent.findMany({
  //   where: {
  //     builderId: builder.id,
  //     week: '2024-W40'
  //   },
  //   include: {
  //     gemsReceipt: true
  //   }
  // });
  // console.log(JSON.stringify(events, null, 2));
  // return;
  const builder = await prisma.scout.findFirstOrThrow({
    where: { path: 'mdqst' },
    include: { githubUsers: true }
  });

  await deleteBuilderEvents(builder.id, builder.githubUsers[0]!.id);
  await processBuilderActivity({
    builderId: builder.id,
    githubUsers: builder.githubUsers[0]!,
    createdAfter: windowStart,
    season: currentSeason
  });
  return;
  console.log('Getting builder activity');
  const w = await prisma.scout.findFirst({
    where: { path: 'mdqst' },
    include: { githubUsers: true }
  });

  const { commits, pullRequests } = await getBuilderActivity({
    login: 'mdqst',
    githubUserId: w?.githubUsers[0]?.id,
    after: DateTime.fromISO('2024-10-28', { zone: 'utc' }).toJSDate()
  });
  console.log(commits.length);
  console.log(pullRequests.length);
})();

async function deleteBuilderEvents(builderId: string, githubUserId: number) {
  const result = await prisma.$transaction([
    prisma.githubEvent.deleteMany({
      where: {
        createdBy: githubUserId,
        createdAt: {
          gt: windowStart
        }
      }
    }),
    prisma.builderEvent.deleteMany({
      where: {
        builderId,
        week: getCurrentWeek(),
        type: {
          in: ['merged_pull_request', 'daily_commit']
        }
      }
    })
  ]);
  console.log('Deleted', result[0], 'github events');
  console.log('Deleted', result[1], 'builder events');
}
