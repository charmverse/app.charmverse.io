import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

import { getPullRequests } from './getPullRequests';
import { processClosedPullRequest } from './processClosedPullRequest';
import { processMergedPullRequest } from './processMergedPullRequest';

export async function processPullRequests() {
  const repos = await prisma.githubRepo.findMany();

  // get Pull requests
  const last24Hours = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const timer = DateTime.now();
  const pullRequests = await getPullRequests({ repos, after: last24Hours });

  log.info(`Retrieved ${pullRequests.length} pull requests in ${timer.diff(DateTime.now(), 'minutes')} minutes`);

  for (const pullRequest of pullRequests) {
    if (pullRequest.state === 'CLOSED') {
      await processClosedPullRequest(pullRequest);
    } else {
      await processMergedPullRequest(pullRequest);
    }
  }
}
