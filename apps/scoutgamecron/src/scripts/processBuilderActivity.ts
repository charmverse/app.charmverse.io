import { processAllBuilderActivity } from '../tasks/processBuilderActivity';
import { getBuilderActivity } from '../tasks/processBuilderActivity/getBuilderActivity';
import { DateTime } from 'luxon';
import { getCurrentWeek, currentSeason } from '@packages/scoutgame/dates';

(async () => {
  const timer = DateTime.now();
  await processAllBuilderActivity({
    createdAfter: DateTime.fromISO('2024-09-27', { zone: 'utc' }).toJSDate()
  });
  // const { commits, pullRequests } = await getBuilderActivity({
  //   login: 'mattcasey',
  //   after: DateTime.fromISO('2024-10-03', { zone: 'utc' }).toJSDate()
  // });

  // console.log(commits.length);
  // console.log(pullRequests.length);
  console.log('Completed in', timer.diff(DateTime.now(), 'minutes'), 'minutes');
})();
