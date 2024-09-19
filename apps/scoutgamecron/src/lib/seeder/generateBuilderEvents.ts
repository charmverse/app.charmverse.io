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
  const weekDay = DateTime.fromJSDate(new Date(), { zone: timezone }).weekday % 7;

  for (let day = 0; day <= weekDay; day++) {
    const dailyGithubEvents = faker.number.int({ min: 3, max: 5 });
    for (let j = 0; j < dailyGithubEvents; j++) {
      const githubRepo = faker.helpers.arrayElement(githubRepos);
      const pullRequestNumber = (repoPRCounters.get(githubRepo.id) as number) + 1;
      repoPRCounters.set(githubRepo.id, pullRequestNumber);

      const pullRequest = generatePullRequest({
        githubRepo,
        githubUser,
        pullRequestNumber,
        daysAgo: day
      });
      await processPullRequest(pullRequest, githubRepo);
    }
  }
}
