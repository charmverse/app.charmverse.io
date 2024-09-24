import type { GithubUser, GithubRepo } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { timezone } from '@packages/scoutgame/utils';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import type { PullRequest } from '../../tasks/processPullRequests/getPullRequests';
import { processClosedPullRequest } from '../../tasks/processPullRequests/processClosedPullRequest';
import { processMergedPullRequest } from '../../tasks/processPullRequests/processMergedPullRequest';

import { generatePullRequest } from './generatePullRequest';

async function processPullRequest(pullRequest: PullRequest, githubRepo: GithubRepo) {
  if (pullRequest.state === 'CLOSED') {
    await processClosedPullRequest({
      pullRequest,
      repo: githubRepo,
      prClosedBy: v4(),
      skipSendingComment: true
    });
  } else if (pullRequest.state === 'MERGED') {
    await processMergedPullRequest({
      pullRequest,
      repo: githubRepo,
      isFirstMergedPullRequest: false
    });
  }
}

export async function generateBuilderEvents(
  githubUser: GithubUser,
  githubRepos: GithubRepo[],
  repoPRCounters: Map<number, number>
) {
  // Generate events for the builder only for the current week
  const weekDay = DateTime.fromJSDate(new Date(), { zone: timezone }).weekday % 7;
  const now = DateTime.now().setZone(timezone);

  for (let day = 0; day <= weekDay; day++) {
    const dailyGithubEvents = faker.number.int({ min: 0, max: 5 });
    for (let j = 0; j < dailyGithubEvents; j++) {
      const createdAt = now.minus({ days: faker.number.int({ min: 0, max: 1 }) });

      const githubRepo = faker.helpers.arrayElement(githubRepos);
      const pullRequestNumber = (repoPRCounters.get(githubRepo.id) as number) + 1;
      repoPRCounters.set(githubRepo.id, pullRequestNumber);

      const pullRequest = generatePullRequest({
        githubRepo,
        githubUser,
        pullRequestNumber,
        // Randomize the minutes, hours and seconds for the createdAt date
        // Also make sure the created at is not in the future
        createdAt: createdAt.set({
          minute: faker.number.int({ min: 0, max: Math.min(59, now.minute) }),
          hour: faker.number.int({ min: 0, max: Math.min(23, now.hour) }),
          second: faker.number.int({ min: 0, max: Math.min(59, now.second) })
        })
      });
      await processPullRequest(pullRequest, githubRepo);
    }
  }
}
