import { processAllBuilderActivity } from '../tasks/processBuilderActivity';
import { processBuilderActivity } from '../tasks/processBuilderActivity/processBuilderActivity';
import { getBuilderActivity } from '../tasks/processBuilderActivity/getBuilderActivity';
import { DateTime } from 'luxon';
import { getCurrentWeek, currentSeason } from '@packages/scoutgame/dates';
import { prisma } from '@charmverse/core/prisma-client';
(async () => {
  const timer = DateTime.now();
  const builders = await prisma.scout.findMany({
    where: {
      builderStatus: 'approved'
    },
    include: {
      githubUser: true
    }
  });

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

  for (const builder of builders) {
    await deleteBuilderEvents(builder.id, builder.githubUser[0]!.id);
  }
  // await processBuilderActivity({
  //   builderId: builder.id,
  //   githubUser: builder.githubUser[0]!,
  //   createdAfter: DateTime.fromISO('2024-09-29', { zone: 'utc' }).toJSDate(),
  //   season: '2024-W40'
  // });
  // return;
  await processAllBuilderActivity(null, {
    createdAfter: DateTime.fromISO('2024-09-27', { zone: 'utc' }).toJSDate()
  });
  return;
  const { commits, pullRequests } = await getBuilderActivity({
    login: 'mattcasey',
    after: DateTime.fromISO('2024-10-03', { zone: 'utc' }).toJSDate()
  });
  console.log(commits.length);
  console.log(pullRequests.length);
  console.log('Completed in', timer.diff(DateTime.now(), 'minutes'), 'minutes');
})();

async function deleteBuilderEvents(builderId: string, githubUserId: number) {
  const result = await prisma.$transaction([
    prisma.githubEvent.deleteMany({
      where: {
        createdBy: githubUserId,
        createdAt: {
          gt: DateTime.fromISO('2024-09-29', { zone: 'utc' }).toJSDate()
        }
      }
    }),
    prisma.builderEvent.deleteMany({
      where: {
        builderId,
        week: '2024-W40',
        type: {
          in: ['merged_pull_request', 'daily_commit']
        }
      }
    })
  ]);
  console.log('Deleted', result[0], 'github events');
  console.log('Deleted', result[1], 'builder events');
}
