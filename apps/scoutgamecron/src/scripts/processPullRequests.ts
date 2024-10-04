import { processPullRequests } from '../tasks/processPullRequests';
import { DateTime } from 'luxon';
import { getCurrentWeek, currentSeason } from '@packages/scoutgame/dates';

(async () => {
  await processPullRequests({
    createdAfter: DateTime.fromISO('2024-09-29', { zone: 'utc' }).toJSDate(),
    onlyProcessNewRepos: true
  });
})();
