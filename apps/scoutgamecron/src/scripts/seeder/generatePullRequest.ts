import type { GithubRepo, GithubUser } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { timezone } from '@packages/scoutgame/utils';
import { DateTime } from 'luxon';

import type { PullRequest } from '../../tasks/processPullRequests/getPullRequests';

export function generatePullRequest({
  githubRepo,
  githubUser,
  pullRequestNumber,
  createdAt
}: {
  githubRepo: GithubRepo;
  githubUser: GithubUser;
  pullRequestNumber: number;
  createdAt: DateTime;
}): PullRequest {
  // 5-10% chance of a closed PR
  const closedPullRequestChance = faker.number.int({ min: 5, max: 10 });
  const nameWithOwner = `${githubRepo.owner}/${githubRepo.name}`;
  const now = DateTime.now().setZone(timezone);
  return {
    baseRefName: 'main',
    author: {
      id: githubUser.id,
      login: githubUser.login
    },
    title: faker.lorem.sentence(),
    url: `https://github.com/${nameWithOwner}/pull/${pullRequestNumber}`,
    createdAt: createdAt.toISO(),
    mergedAt: now.toISO(),
    number: pullRequestNumber,
    repository: {
      id: githubRepo.id,
      nameWithOwner
    },
    state: faker.number.int({ min: 1, max: 100 }) <= closedPullRequestChance ? 'CLOSED' : 'MERGED'
  };
}
