import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { v4 } from 'uuid';

import type { PullRequest } from '../getPullRequests';

// Function to generate random large integers
const randomLargeInt = () => Math.floor(Math.random() * 1000000000) + 1000000000;

jest.unstable_mockModule('../getClosedPullRequest', () => ({
  getClosedPullRequest: jest.fn()
}));

jest.unstable_mockModule('../githubClient', () => ({
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
const { octokit } = await import('../githubClient');

describe('processClosedPullRequest', () => {
  beforeEach(async () => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should process a closed pull request and create a strike', async () => {
    const githubUserId = randomLargeInt();
    const repoId = randomLargeInt();
    const prNumber = randomLargeInt();
    const username = v4();

    const builder = await prisma.scout.create({
      data: {
        username,
        displayName: 'Test User',
        builder: true
      }
    });

    const githubUser = await prisma.githubUser.create({
      data: {
        id: githubUserId,
        login: username,
        builderId: builder.id
      }
    });

    const repo = await prisma.githubRepo.create({
      data: {
        id: repoId,
        defaultBranch: 'main',
        owner: username,
        name: 'testrepo'
      }
    });

    const pullRequest: PullRequest = {
      number: prNumber,
      baseRefName: 'main',
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      title: 'Test PR',
      state: 'CLOSED',
      author: { id: githubUserId, login: username },
      repository: { id: repoId, nameWithOwner: `${repo.owner}/${repo.name}` },
      url: `https://github.com/${username}/testrepo/pull/${prNumber}`
    };

    (getClosedPullRequest as jest.Mock<typeof getClosedPullRequest>).mockResolvedValue({ login: v4() });
    await processClosedPullRequest(pullRequest, repo);

    const githubEvent = await prisma.githubEvent.findFirstOrThrow({
      where: {
        pullRequestNumber: pullRequest.number,
        type: 'closed_pull_request',
        createdBy: githubUserId
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
    const githubUserId = randomLargeInt();
    const repoId = randomLargeInt();
    const prNumber = randomLargeInt();
    const username = v4();

    const builder = await prisma.scout.create({
      data: {
        username,
        displayName: 'Test User',
        builder: true
      }
    });

    const githubUser = await prisma.githubUser.create({
      data: {
        id: githubUserId,
        login: username,
        builderId: builder.id
      }
    });

    const repo = await prisma.githubRepo.create({
      data: {
        id: repoId,
        defaultBranch: 'main',
        owner: username,
        name: 'testrepo'
      }
    });

    const pullRequest: PullRequest = {
      number: prNumber,
      title: 'Test PR',
      state: 'CLOSED',
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      baseRefName: 'main',
      author: { id: githubUserId, login: username },
      repository: { id: repoId, nameWithOwner: `${repo.owner}/${repo.name}` },
      url: `https://github.com/${username}/testrepo/pull/${prNumber}`
    };

    (getClosedPullRequest as jest.Mock<typeof getClosedPullRequest>).mockResolvedValue({ login: username });

    await processClosedPullRequest(pullRequest, repo);

    const githubEvent = await prisma.githubEvent.findFirstOrThrow({
      where: {
        pullRequestNumber: pullRequest.number,
        type: 'closed_pull_request',
        createdBy: githubUserId
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
    const githubUserId = randomLargeInt();
    const repoId = randomLargeInt();
    const username = v4();

    const builder = await prisma.scout.create({
      data: {
        username,
        displayName: 'Test User',
        builder: true
      }
    });

    const githubUser = await prisma.githubUser.create({
      data: {
        id: githubUserId,
        login: username,
        builderId: builder.id
      }
    });

    const repo = await prisma.githubRepo.create({
      data: {
        id: repoId,
        defaultBranch: 'main',
        owner: username,
        name: 'testrepo'
      }
    });

    const pullRequest: Omit<PullRequest, 'number'> = {
      baseRefName: 'main',
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      title: 'Test PR',
      state: 'CLOSED',
      author: { id: githubUserId, login: username },
      repository: { id: repoId, nameWithOwner: `${repo.owner}/${repo.name}` },
      url: `https://github.com/${username}/testrepo/pull/${randomLargeInt()}`
    };

    (getClosedPullRequest as jest.Mock<typeof getClosedPullRequest>).mockResolvedValue({ login: v4() });

    for (let i = 0; i < 3; i++) {
      await processClosedPullRequest({ ...pullRequest, number: i + 1 }, repo);
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
    const prNumber = randomLargeInt();
    const username = v4();

    const pullRequest: PullRequest = {
      number: prNumber,
      baseRefName: 'main',
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      title: 'Test PR',
      state: 'CLOSED',
      author: { id: randomLargeInt(), login: username },
      repository: { id: repoId, nameWithOwner: `${username}/testrepo` },
      url: `https://github.com/${username}/testrepo/pull/${prNumber}`
    };

    await prisma.githubRepo.create({
      data: {
        id: repoId,
        defaultBranch: 'main',
        owner: username,
        name: 'testrepo'
      }
    });

    const githubEvent = await prisma.githubEvent.findFirst({
      where: { pullRequestNumber: pullRequest.number }
    });
    expect(githubEvent).toBeNull();
    expect(octokit.rest.issues.createComment).not.toHaveBeenCalled();
  });

  it('should not create a new github event if it was processed before', async () => {
    const githubUserId = randomLargeInt();
    const repoId = randomLargeInt();
    const prNumber = randomLargeInt();
    const username = v4();

    const builder = await prisma.scout.create({
      data: {
        username,
        displayName: 'Test User',
        builder: true
      }
    });

    const githubUser = await prisma.githubUser.create({
      data: {
        id: githubUserId,
        login: username,
        builderId: builder.id
      }
    });

    const repo = await prisma.githubRepo.create({
      data: {
        id: repoId,
        defaultBranch: 'main',
        owner: username,
        name: 'testrepo'
      }
    });

    const pullRequest: PullRequest = {
      number: prNumber,
      baseRefName: 'main',
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      title: 'Test PR',
      state: 'CLOSED',
      author: { id: githubUserId, login: username },
      repository: { id: repoId, nameWithOwner: `${repo.owner}/${repo.name}` },
      url: `https://github.com/${username}/testrepo/pull/${prNumber}`
    };

    (getClosedPullRequest as jest.Mock<typeof getClosedPullRequest>).mockResolvedValue({ login: v4() });

    await processClosedPullRequest(pullRequest, repo);
    await processClosedPullRequest(pullRequest, repo);
    await processClosedPullRequest(pullRequest, repo);

    const githubEventsCount = await prisma.githubEvent.count({
      where: {
        githubUser: {
          id: githubUserId
        }
      }
    });
    expect(githubEventsCount).toBe(1);
    expect(octokit.rest.issues.createComment).toHaveBeenCalledTimes(1);
  });
});
