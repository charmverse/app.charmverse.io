import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { v4 } from 'uuid';

import { mockBuilder, mockRepo } from '@/testing/database';
import { randomLargeInt, mockPullRequest } from '@/testing/generators';

jest.unstable_mockModule('../getClosedPullRequest', () => ({
  getClosedPullRequest: jest.fn()
}));

jest.unstable_mockModule('@packages/github/client', () => ({
  octokit: {
    rest: {
      issues: {
        createComment: jest.fn()
      }
    }
  }
}));

const { getClosedPullRequest } = await import('../getClosedPullRequest');
const { processClosedPullRequest } = await import('../processClosedPullRequest');
const { octokit } = await import('@packages/github/client');

describe('processClosedPullRequest', () => {
  beforeEach(async () => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should process a closed pull request and create a strike', async () => {
    const builder = await mockBuilder();
    const repo = await mockRepo();

    const pullRequest = mockPullRequest({
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      state: 'CLOSED',
      author: builder.githubUser,
      repo
    });

    (getClosedPullRequest as jest.Mock<typeof getClosedPullRequest>).mockResolvedValue({ login: v4() });
    await processClosedPullRequest({ pullRequest, repo });

    const githubEvent = await prisma.githubEvent.findFirstOrThrow({
      where: {
        pullRequestNumber: pullRequest.number,
        type: 'closed_pull_request',
        createdBy: builder.githubUser.id
      }
    });
    expect(githubEvent).toBeDefined();

    const strike = await prisma.builderStrike.findFirst({
      where: { builderId: builder.id }
    });
    expect(strike).toBeDefined();
    expect(octokit.rest.issues.createComment).toHaveBeenCalled();
  });

  it('should not create a strike if the PR was closed by the author', async () => {
    const builder = await mockBuilder();

    const repo = await mockRepo();

    const pullRequest = mockPullRequest({
      state: 'CLOSED',
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      author: builder.githubUser,
      repo
    });

    (getClosedPullRequest as jest.Mock<typeof getClosedPullRequest>).mockResolvedValue(builder.githubUser);

    await processClosedPullRequest({ pullRequest, repo });

    const githubEvent = await prisma.githubEvent.findFirstOrThrow({
      where: {
        pullRequestNumber: pullRequest.number,
        type: 'closed_pull_request',
        createdBy: builder.githubUser.id
      }
    });
    expect(githubEvent).toBeDefined();

    const strike = await prisma.builderStrike.findFirst({
      where: { builderId: builder.id }
    });
    expect(strike).toBeNull();
    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it('should ban a builder after 3 strikes', async () => {
    const builder = await mockBuilder();

    const repo = await mockRepo();

    const pullRequest = mockPullRequest({
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      state: 'CLOSED',
      author: builder.githubUser,
      repo
    });

    (getClosedPullRequest as jest.Mock<typeof getClosedPullRequest>).mockResolvedValue({ login: v4() });

    for (let i = 0; i < 3; i++) {
      await processClosedPullRequest({ pullRequest: { ...pullRequest, number: i + 1 }, repo });
    }

    const strikes = await prisma.builderStrike.findMany({
      where: { builderId: builder.id }
    });
    expect(strikes).toHaveLength(3);

    const bannedBuilder = await prisma.scout.findUniqueOrThrow({
      where: { id: builder.id }
    });
    expect(bannedBuilder.bannedAt).toBeDefined();
    expect(octokit.rest.issues.createComment).toHaveBeenCalled();
  });

  it('should not process a pull request for a non-existent builder', async () => {
    const repoId = randomLargeInt();
    const username = v4();

    const pullRequest = mockPullRequest({
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      title: 'Test PR',
      state: 'CLOSED',
      author: { id: randomLargeInt(), login: username },
      repository: { id: repoId, nameWithOwner: `${username}/testrepo` },
      url: `https://github.com/${username}/testrepo/pull/${randomLargeInt()}`
    });

    await mockRepo();

    const githubEvent = await prisma.githubEvent.findFirst({
      where: { pullRequestNumber: pullRequest.number }
    });
    expect(githubEvent).toBeNull();
    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it('should not create a new github event if it was processed before', async () => {
    const builder = await mockBuilder();

    const repo = await mockRepo();

    const pullRequest = mockPullRequest({
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      state: 'CLOSED',
      author: builder.githubUser,
      repo
    });

    (getClosedPullRequest as jest.Mock<typeof getClosedPullRequest>).mockResolvedValue({ login: v4() });

    await processClosedPullRequest({ pullRequest, repo });
    await processClosedPullRequest({ pullRequest, repo });
    await processClosedPullRequest({ pullRequest, repo });

    const githubEventsCount = await prisma.githubEvent.count({
      where: {
        githubUser: {
          id: builder.githubUser.id
        }
      }
    });
    expect(githubEventsCount).toBe(1);
    expect(octokit.rest.issues.createComment).toHaveBeenCalledTimes(1);
  });
});
