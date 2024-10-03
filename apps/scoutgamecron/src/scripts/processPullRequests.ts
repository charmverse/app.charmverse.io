import { processPullRequests } from '../tasks/processPullRequests';
import { DateTime } from 'luxon';
import { decodeGithubUserId } from '../tasks/processPullRequests/getPullRequests';
(async () => {
  console.log(Buffer.from('U_kgDOB0sJ8Q', 'base64').toString('utf-8'));
  console.log(Buffer.from('U_kgDOB-4rVA', 'base64').toString('utf-8'));
  // await processPullRequests({
  //   createdAfter: DateTime.fromISO('2024-09-29', { zone: 'utc' }).toJSDate()
  // });
})();
