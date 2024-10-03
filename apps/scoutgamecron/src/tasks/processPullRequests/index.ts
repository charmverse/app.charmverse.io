import { log } from '@charmverse/core/log';
import type { GithubRepo } from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getCurrentWeek, currentSeason } from '@packages/scoutgame/dates';
import { DateTime } from 'luxon';

import { getPullRequests } from './getPullRequests';
import { processClosedPullRequest } from './processClosedPullRequest';
import { processMergedPullRequest } from './processMergedPullRequest';
import { updateBuildersRank } from './updateBuildersRank';

type Options = {
  createdAfter?: Date;
  skipClosedPrProcessing?: boolean;
  season?: string;
  onlyProcessNewRepos?: boolean;
};

export async function processPullRequests({
  createdAfter = new Date(Date.now() - 30 * 60 * 1000),
  skipClosedPrProcessing = false,
  onlyProcessNewRepos = false,
  season = currentSeason
}: Options = {}) {
  const repos = await prisma.githubRepo.findMany({
    where: {
      deletedAt: null,
      id: {
        gt: 208938406
      }
    },
    // sort the repos in case it fails, so we can resume from the next one
    orderBy: {
      id: 'asc'
    },
    select: {
      id: true,
      owner: true,
      name: true,
      defaultBranch: true
    }
  });
  log.info(`Found ${repos.length} repos to check for PRs`);

  for (let i = 0; i < repos.length; i += 100) {
    const reposBatch = repos.slice(i, i + 100);
    await processPullRequestsForRepos({
      repos: reposBatch,
      createdAfter,
      skipClosedPrProcessing,
      season,
      onlyProcessNewRepos
    });
    log.debug(`Processed ${i}/${repos.length} repos, last Id: ${reposBatch[reposBatch.length - 1].id}`);
  }

  await updateBuildersRank({ week: getCurrentWeek() });
}

async function processPullRequestsForRepos({
  repos,
  createdAfter,
  skipClosedPrProcessing,
  onlyProcessNewRepos,
  season
}: Options & {
  createdAfter: Date;
  season: string;
  repos: Pick<GithubRepo, 'id' | 'owner' | 'name' | 'defaultBranch'>[];
}) {
  const timer = DateTime.now();

  if (onlyProcessNewRepos) {
    const existingPullRequests = await prisma.githubEvent.findMany({
      where: {
        repoId: {
          in: repos.map((r) => r.id)
        }
      }
    });
    if (existingPullRequests.length) {
      log.info(`Skip some repos because they have been processed before`);
      return;
    }
    repos = repos.filter((r) => !existingPullRequests.some((e) => e.repoId === r.id));
  }

  const pullRequests = await getPullRequests({ repos, after: createdAfter });

  const githubEvents = await prisma.githubEvent.findMany({
    where: {
      createdAt: {
        gt: createdAfter
      }
    }
  });
  const newPullRequests = pullRequests.filter(
    (pr) => !githubEvents.some((e) => e.pullRequestNumber === pr.number && e.repoId === pr.repository.id)
  );

  const uniqueRepos = Array.from(new Set(pullRequests.map((pr) => pr.repository.id)));

  // pullRequests.map((pr) => pr.repository.id);

  log.info(
    `Retrieved ${newPullRequests.length} new PRs (out of ${pullRequests.length}) across ${
      uniqueRepos.length
    } repos in ${timer.diff(DateTime.now(), 'minutes')} minutes`
  );

  let i = 0;

  for (const pullRequest of newPullRequests) {
    i += 1;
    log.debug(
      `Processing PR ${i}/${newPullRequests.length} -- ${pullRequest.repository.nameWithOwner}/${pullRequest.number}`
    );
    const repo = repos.find(
      (r) =>
        `${r.owner}/${r.name}` === pullRequest.repository.nameWithOwner ||
        // consider repo id in case it was a fork, in which casethe nameWithOwner may not match the name of the repo for some reason
        r.id === pullRequest.repository.id
    );
    if (repo) {
      try {
        if (pullRequest.state === 'CLOSED') {
          if (!skipClosedPrProcessing) {
            await processClosedPullRequest({ pullRequest, repo, season });
          }
        } else {
          await processMergedPullRequest({ pullRequest, repo, season });
        }
      } catch (error) {
        log.error(`Error processing ${pullRequest.repository.nameWithOwner}/${pullRequest.number}`, { error });
      }
    } else {
      log.error(`Repo not found for pull request: ${pullRequest.repository.nameWithOwner}`);
    }
  }

  log.info(`Processed ${pullRequests.length} pull requests in ${timer.diff(DateTime.now(), 'minutes')} minutes`);
}
