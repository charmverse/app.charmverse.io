import { processPullRequests } from '../tasks/processPullRequests';
import { DateTime } from 'luxon';
(async () => {
  await processPullRequests({
    createdAfter: DateTime.fromISO('2024-09-29', { zone: 'utc' }).toJSDate()
  });
})();
