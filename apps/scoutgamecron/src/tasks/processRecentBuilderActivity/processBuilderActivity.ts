import { log } from '@charmverse/core/log';
import type {
  ActivityRecipientType,
  GemsReceiptType,
  GithubRepo,
  ScoutGameActivityType
} from '@charmverse/core/prisma-client';
import { prisma } from '@charmverse/core/prisma-client';
import { getBonusPartner } from '@packages/scoutgame/bonus';
import { getWeekFromDate, getWeekStartEnd, streakWindow, isToday, currentSeason } from '@packages/scoutgame/dates';
import { isTruthy } from '@packages/utils/types';
import { DateTime } from 'luxon';

import type { PullRequest } from './getPullRequests';
import { getPullRequests } from './getPullRequests';
import { getRecentPullRequestsByUser } from './getRecentPullRequestsByUser';
import { processClosedPullRequest } from './processClosedPullRequest';
import { processMergedPullRequest } from './processMergedPullRequest';
import { updateBuildersRank } from './updateBuildersRank';

type RepoInput = Pick<GithubRepo, 'defaultBranch'>;

export type MergedPullRequestMeta = Pick<
  PullRequest,
  'author' | 'number' | 'title' | 'repository' | 'url' | 'createdAt' | 'mergedAt'
>;

type Props = {
  builderId: string;
  githubUser: {
    id: number;
    login: string;
  };
  createdAfter: Date;
  season: string;
  now?: DateTime;
};

/**
 *
 * @isFirstMergedPullRequest Only used for the seed data generator
 */
export async function processBuilderActivity({ builderId, githubUser, season, now = DateTime.utc() }: Props) {
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
