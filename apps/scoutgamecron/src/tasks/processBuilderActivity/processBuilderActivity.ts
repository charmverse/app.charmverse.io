import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import { getWeekFromDate } from '@packages/scoutgame/dates';
import { DateTime } from 'luxon';

import { getBuilderActivity } from './getBuilderActivity';
import { recordClosedPullRequest } from './recordClosedPullRequest';
import { recordCommit } from './recordCommit';
import { recordMergedPullRequest } from './recordMergedPullRequest';

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

export async function processBuilderActivity({
  builderId,
  githubUser,
  createdAfter,
  season,
  now = DateTime.utc()
}: Props) {
  const timer = DateTime.now();
  const week = getWeekFromDate(now.toJSDate());

  const { commits, pullRequests, newOwnerRepos } = await getBuilderActivity({
    login: githubUser.login,
    after: createdAfter
  });

  const githubEvents = await prisma.githubEvent.findMany({
    where: {
      createdBy: githubUser.id,
      createdAt: {
        gt: createdAfter
      }
    }
  });

  const newCommits = commits.filter(
    (commit) => !githubEvents.some((e) => e.commitHash === commit.sha && e.repoId === commit.repository.id)
  );

  const newPullRequests = pullRequests.filter(
    (pr) => !githubEvents.some((e) => e.pullRequestNumber === pr.number && e.repoId === pr.repository.id)
  );

  log.debug(`Retrieved builder activity in ${timer.diff(DateTime.now(), 'minutes')} minutes`, {
    commits: commits.length,
    newCommits: newCommits.length,
    prs: pullRequests.length,
    newPrs: newPullRequests.length,
    newRepos: newOwnerRepos.map((r) => r.full_name),
    userId: builderId
  });

  if (newOwnerRepos.length) {
    await prisma.githubRepo.createMany({
      data: newOwnerRepos.map((repo) => ({
        id: repo.id,
        owner: repo.owner.login,
        name: repo.name,
        ownerType: 'user',
        defaultBranch: repo.default_branch || 'main'
      }))
    });
    log.debug('Created new repos based on commit from owner', {
      newRepos: newOwnerRepos.map((r) => r.full_name),
      userId: builderId
    });
  }

  // Loop thru new pull requests
  for (const pullRequest of newPullRequests) {
    log.debug(
      `Processing PR ${newPullRequests.indexOf(pullRequest) + 1}/${newPullRequests.length} -- ${
        pullRequest.repository.nameWithOwner
      }/${pullRequest.number}`
    );
    const repo = await prisma.githubRepo.findFirst({
      where: {
        owner: pullRequest.repository.owner.login,
        name: pullRequest.repository.name
      }
    });
    if (repo) {
      try {
        if (pullRequest.state === 'CLOSED') {
          await recordClosedPullRequest({ pullRequest, repo, season });
        } else {
          await recordMergedPullRequest({ pullRequest, repo, season });
        }
      } catch (error) {
        log.error(`Error processing ${pullRequest.repository.nameWithOwner}/${pullRequest.number}`, { error });
      }
    } else {
      log.error(`Repo not found for pull request: ${pullRequest.repository.nameWithOwner}`);
    }
  }

  // Loop thru new commits
  for (const commit of newCommits) {
    try {
      await recordCommit({ commit, season });
    } catch (error) {
      log.error(`Error processing commit ${commit.sha}`, { error });
    }
  }

  const thisWeekEvents = await prisma.builderEvent.findMany({
    where: {
      builderId,
      week
    },
    select: {
      gemsReceipt: {
        select: {
          value: true
        }
      }
    }
  });

  const gemsCollected = thisWeekEvents.reduce((acc, e) => {
    if (e.gemsReceipt?.value) {
      return acc + e.gemsReceipt.value;
    }
    return acc;
  }, 0);

  await prisma.userWeeklyStats.upsert({
    where: {
      userId_week: {
        userId: builderId,
        week
      }
    },
    create: {
      userId: builderId,
      week,
      season,
      gemsCollected
    },
    update: {
      gemsCollected
    }
  });
  log.debug(`Processed activity for builder`, {
    userId: builderId,
    week,
    eventsWithWeek: thisWeekEvents.length,
    gemsCollected
  });
}
