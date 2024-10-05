import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';

import { getBuilderActivity } from './getBuilderActivity';
import { processClosedPullRequest } from './processClosedPullRequest';
import { processMergedPullRequest } from './processMergedPullRequest';

type Props = {
  builderId: string;
  githubUser: {
    id: number;
    login: string;
  };
  createdAfter: Date;
  season: string;
  now?: DateTime;
  skipClosedPrProcessing?: boolean;
};

/**
 *
 * @isFirstMergedPullRequest Only used for the seed data generator
 */
export async function processBuilderActivity({
  builderId,
  githubUser,
  skipClosedPrProcessing,
  createdAfter,
  season,
  now = DateTime.utc()
}: Props) {
  const timer = DateTime.now();

  const { commits, pullRequests } = await getBuilderActivity({ login: githubUser.login, after: createdAfter });

  const githubEvents = await prisma.githubEvent.findMany({
    where: {
      createdBy: githubUser.id,
      createdAt: {
        gt: createdAfter
      }
    }
  });

  const newCommits = commits.filter(
    (commit) => !githubEvents.some((e) => e.commitHash === commit.commitHash && e.repoId === commit.repository.id)
  );

  const newPullRequests = pullRequests.filter(
    (pr) => !githubEvents.some((e) => e.pullRequestNumber === pr.number && e.repoId === pr.repository.id)
  );

  log.info(
    `Retrieved ${commits.length} commits and ${pullRequests.length} PRs in ${timer.diff(
      DateTime.now(),
      'minutes'
    )} minutes for ${githubUser.login}`
  );

  let i = 0;

  for (const pullRequest of newPullRequests) {
    i += 1;
    log.debug(
      `Processing PR ${i}/${newPullRequests.length} -- ${pullRequest.repository.nameWithOwner}/${pullRequest.number}`
    );
    const repo = await prisma.githubRepo.findFirst({
      where: {
        owner: pullRequest.repository.owner,
        name: pullRequest.repository.name
      }
    });
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
