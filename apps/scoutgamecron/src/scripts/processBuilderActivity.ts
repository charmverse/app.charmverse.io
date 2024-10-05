import { processAllBuilderActivity } from '../tasks/processBuilderActivity';
import { getBuilderActivity } from '../tasks/processBuilderActivity/getBuilderActivity';
import { DateTime } from 'luxon';
import { getCurrentWeek, currentSeason } from '@packages/scoutgame/dates';

(async () => {
  const { commits, pullRequests } = await getBuilderActivity({
    login: 'mattcasey',
    after: DateTime.fromISO('2024-10-03', { zone: 'utc' }).toJSDate()
  });
  console.log(pullRequests);

  console.log(commits.length);
  console.log(pullRequests.length);
})();
