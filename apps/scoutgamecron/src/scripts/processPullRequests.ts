import { processPullRequests } from '../tasks/processPullRequests';
(async () => {
  await processPullRequests();
})();
