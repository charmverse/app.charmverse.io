import { prisma, type GithubRepo, type GithubUser } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';

import { currentSeason, getWeekFromDate } from '@packages/scoutgame/dates';
import { generatePullRequest } from './generatePullRequest';
import { randomTimeOfDay } from './generator';
import { PullRequest } from '../../tasks/processBuilderActivity/github/getPullRequestsByUser';
import { recordClosedPullRequest } from '../../tasks/processBuilderActivity/recordClosedPullRequest';
import { recordMergedPullRequest } from '../../tasks/processBuilderActivity/recordMergedPullRequest';
import { log } from '@charmverse/core/log';
import { v4 } from 'uuid';

async function processBuilderActivity({
  date,
  season,
  builderId,
  pullRequests
}: {
  builderId: string;
  date: DateTime,
  season: string,
  pullRequests: PullRequest[],
}) {
  const week = getWeekFromDate(date.toJSDate());

  for (const pullRequest of pullRequests) {
    const repo = await prisma.githubRepo.findFirst({
      where: {
        owner: pullRequest.repository.owner.login,
        name: pullRequest.repository.name
      }
    });
    if (repo) {
      try {
        if (pullRequest.state === 'CLOSED') {
          await recordClosedPullRequest({ pullRequest, repo, season, prClosedBy: v4() });
        } else {
          await recordMergedPullRequest({ pullRequest, repo, season, skipFirstMergedPullRequestCheck: true });
        }
      } catch (error) {
        log.error(`Error processing ${pullRequest.repository.nameWithOwner}/${pullRequest.number}`, { error });
      }
    } else {
      log.error(`Repo not found for pull request: ${pullRequest.repository.nameWithOwner}`);
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

export async function generateBuilderEvents(
  {
    builderId,
    date,
    githubUser,
    githubRepos,
    repoPRCounters
  }: {
    builderId: string,
    githubUser: Pick<GithubUser, 'id' | 'login'>,
    githubRepos: GithubRepo[],
    repoPRCounters: Map<number, number>,
    date: DateTime
  }
) {
  const builderPullRequests: PullRequest[] = [];
  const dailyGithubEvents = faker.number.int({ min: 0, max: 3 });
  for (let eventsCounter = 0; eventsCounter < dailyGithubEvents; eventsCounter++) {
    const githubRepo = faker.helpers.arrayElement(githubRepos);
    const pullRequestNumber = (repoPRCounters.get(githubRepo.id) as number) + 1;
    repoPRCounters.set(githubRepo.id, pullRequestNumber);

    const pullRequest = generatePullRequest({
      githubRepo,
      githubUser,
      pullRequestNumber,
      // Randomize the minutes, hours and seconds for the createdAt date
      // Also make sure the created at is not in the future
      createdAt: randomTimeOfDay(date)
    });
    builderPullRequests.push(pullRequest);
  }

  await processBuilderActivity({
    builderId,
    season: currentSeason,
    pullRequests: builderPullRequests,
    date
  });

  return dailyGithubEvents;
}
