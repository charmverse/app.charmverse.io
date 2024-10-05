import type { GithubRepo, GithubUser } from '@charmverse/core/prisma-client';
import { faker } from '@faker-js/faker';
import { DateTime } from 'luxon';

import type { PullRequest } from '../../tasks/processRecentBuilderActivity/getPullRequestsByRepo';

export function generatePullRequest({
  githubRepo,
  githubUser,
  pullRequestNumber,
  createdAt
}: {
  githubRepo: GithubRepo;
  githubUser: Pick<GithubUser, 'id' | 'login'>;
  pullRequestNumber: number;
  createdAt: DateTime;
}): PullRequest {
  // 0-5% chance of a closed PR
  const closedPullRequestChance = faker.number.int({ min: 0, max: 5 });
  const nameWithOwner = `${githubRepo.owner}/${githubRepo.name}`;
  return {
    baseRefName: 'main',
    author: {
      id: githubUser.id,
      login: githubUser.login
    },
    title: faker.lorem.sentence(),
    url: `https://github.com/${nameWithOwner}/pull/${pullRequestNumber}`,
    createdAt: createdAt.toISO(),
    mergedAt: createdAt.toISO(),
    number: pullRequestNumber,
    repository: {
      id: githubRepo.id,
      nameWithOwner
    },
    state: faker.number.int({ min: 1, max: 100 }) <= closedPullRequestChance ? 'CLOSED' : 'MERGED'
  };
}
