import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, currentSeason } from '@packages/scoutgame/dates';
import { DateTime } from 'luxon';

import { getPullRequests } from './getPullRequests';
import { processClosedPullRequest } from './processClosedPullRequest';
import { processMergedPullRequest } from './processMergedPullRequest';
import { updateBuildersRank } from './updateBuildersRank';

export async function processPullRequests({
  createdAfter,
  skipClosedPrProcessing = false,
  season = currentSeason
}: { createdAfter?: Date; skipClosedPrProcessing?: boolean; season?: string } = {}) {
  const repos = await prisma.githubRepo.findMany();

  // get Pull requests
  const lastHour = new Date(Date.now() - 1 * 60 * 60 * 1000);

  const fromDateTime = createdAfter ?? lastHour;

  const timer = DateTime.now();
  const pullRequests = await getPullRequests({ repos, after: fromDateTime });

  const uniqueRepos = Array.from(new Set(pullRequests.map((pr) => pr.repository.id)));

  // pullRequests.map((pr) => pr.repository.id);

  log.info(
    `Retrieved ${pullRequests.length} pull requests across ${uniqueRepos.length} repos in ${timer.diff(
      DateTime.now(),
      'minutes'
    )} minutes`
  );

  for (const pullRequest of pullRequests) {
    const repo = repos.find((r) => `${r.owner}/${r.name}` === pullRequest.repository.nameWithOwner);
    if (!repo) {
      throw new Error(`Repo not found: ${pullRequest.repository.nameWithOwner}`);
    }
    if (pullRequest.state === 'CLOSED') {
      if (!skipClosedPrProcessing) {
        await processClosedPullRequest({ pullRequest, repo, season });
      }
    } else {
      await processMergedPullRequest({ pullRequest, repo, season });
    }
  }

  await updateBuildersRank({ week: getCurrentWeek() });

  log.info(`Processed ${pullRequests.length} pull requests in ${timer.diff(DateTime.now(), 'minutes')} minutes`);
}
