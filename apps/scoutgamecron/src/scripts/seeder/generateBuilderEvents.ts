import type { GithubUser, GithubRepo } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { recordMergedPullRequest } from '../../tasks/processBuilderActivity/recordMergedPullRequest';
import type { PullRequest } from '../../tasks/processBuilderActivity/github/getPullRequestsByUser';
import { recordClosedPullRequest } from '../../tasks/processBuilderActivity/recordClosedPullRequest';
import { currentSeason } from '@packages/scoutgame/dates';
import { generatePullRequest } from './generatePullRequest';
import { randomTimeOfDay } from './generator';

async function processPullRequest(pullRequest: PullRequest, githubRepo: GithubRepo, date: DateTime) {
  if (pullRequest.state === 'CLOSED') {
    await recordClosedPullRequest({
      pullRequest,
      repo: githubRepo,
      prClosedBy: v4(),
      season: currentSeason,
      skipSendingComment: true
    });
  } else if (pullRequest.state === 'MERGED') {
    await recordMergedPullRequest({
      pullRequest,
      season: currentSeason,
      repo: githubRepo,
      isFirstMergedPullRequest: false,
      now: date
    });
  }
}

export async function generateBuilderEvents(
  githubUser: Pick<GithubUser, 'id' | 'login'>,
  githubRepos: GithubRepo[],
  repoPRCounters: Map<number, number>,
  date: DateTime
) {
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
    await processPullRequest(pullRequest, githubRepo, date);
  }

  return dailyGithubEvents;
}
