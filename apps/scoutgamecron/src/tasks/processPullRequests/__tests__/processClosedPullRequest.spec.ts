import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';

import type { PullRequest } from '../getPullRequests';

jest.unstable_mockModule('../getClosedPullRequest', () => ({
  getClosedPullRequest: jest.fn()
}));

const { processClosedPullRequest } = await import('../processClosedPullRequest');
const { getClosedPullRequest } = await import('../getClosedPullRequest');

describe('processClosedPullRequest', () => {
  beforeEach(async () => {
    // Clear the database before each test
    await prisma.$transaction([
      prisma.builderStrike.deleteMany(),
      prisma.githubEvent.deleteMany(),
      prisma.githubUser.deleteMany(),
      prisma.scout.deleteMany(),
      prisma.githubRepo.deleteMany()
    ]);

    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should process a closed pull request and create a strike', async () => {
    const builder = await prisma.scout.create({
      data: {
        username: 'testuser',
        displayName: 'Test User',
        builder: true
      }
    });

    const githubUser = await prisma.githubUser.create({
      data: {
        id: 1, // Using serial int for GitHub user ID
        login: 'testuser',
        builderId: builder.id
      }
    });

    const repo = await prisma.githubRepo.create({
      data: {
        id: 1,
        defaultBranch: 'main',
        owner: 'testuser',
        name: 'testrepo'
      }
    });

    const pullRequest: PullRequest = {
      number: 1,
      baseRefName: 'main',
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      title: 'Test PR',
      state: 'CLOSED',
      author: { id: githubUser.id, login: githubUser.login },
      repository: { id: repo.id, nameWithOwner: `${repo.owner}/${repo.name}` },
      url: 'https://github.com/testuser/testrepo/pull/1'
    };

    (getClosedPullRequest as jest.Mock<typeof getClosedPullRequest>).mockResolvedValue({ login: 'otheruser' });

    await processClosedPullRequest(pullRequest, repo);

    const githubEvent = await prisma.githubEvent.findFirstOrThrow({
      where: {
        pullRequestNumber: pullRequest.number,
        type: 'closed_pull_request',
        createdBy: githubUser.id
      }
    });
    expect(githubEvent).toBeDefined();

    const strike = await prisma.builderStrike.findFirst({
      where: { builderId: builder.id }
    });
    expect(strike).toBeDefined();
  });

  it('should not create a strike if the PR was closed by the author', async () => {
    const builder = await prisma.scout.create({
      data: {
        username: 'testuser',
        displayName: 'Test User',
        builder: true
      }
    });

    const githubUser = await prisma.githubUser.create({
      data: {
        id: 1, // Using serial int for GitHub user ID
        login: 'testuser',
        builderId: builder.id
      }
    });

    const repo = await prisma.githubRepo.create({
      data: {
        id: 1,
        defaultBranch: 'main',
        owner: 'testuser',
        name: 'testrepo'
      }
    });

    const pullRequest: PullRequest = {
      number: 1,
      title: 'Test PR',
      state: 'CLOSED',
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      baseRefName: 'main',
      author: { id: githubUser.id, login: githubUser.login },
      repository: { id: repo.id, nameWithOwner: `${repo.owner}/${repo.name}` },
      url: 'https://github.com/testuser/testrepo/pull/1'
    };

    (getClosedPullRequest as jest.Mock<typeof getClosedPullRequest>).mockResolvedValue({ login: 'testuser' });

    await processClosedPullRequest(pullRequest, repo);

    const githubEvent = await prisma.githubEvent.findFirstOrThrow({
      where: {
        pullRequestNumber: pullRequest.number,
        type: 'closed_pull_request',
        createdBy: githubUser.id
      }
    });
    expect(githubEvent).toBeDefined();

    const strike = await prisma.builderStrike.findFirst({
      where: { builderId: builder.id }
    });
    expect(strike).toBeNull();
  });

  it('should ban a builder after 3 strikes', async () => {
    const builder = await prisma.scout.create({
      data: {
        username: 'testuser',
        displayName: 'Test User',
        builder: true
      }
    });

    const githubUser = await prisma.githubUser.create({
      data: {
        id: 1,
        login: 'testuser',
        builderId: builder.id
      }
    });

    const repo = await prisma.githubRepo.create({
      data: {
        id: 1,
        defaultBranch: 'main',
        owner: 'testuser',
        name: 'testrepo'
      }
    });

    const pullRequest: Omit<PullRequest, 'number'> = {
      baseRefName: 'main',
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      title: 'Test PR',
      state: 'CLOSED',
      author: { id: githubUser.id, login: githubUser.login },
      repository: { id: repo.id, nameWithOwner: `${repo.owner}/${repo.name}` },
      url: 'https://github.com/testuser/testrepo/pull/1'
    };

    (getClosedPullRequest as jest.Mock<typeof getClosedPullRequest>).mockResolvedValue({ login: 'otheruser' });

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
  });

  it('should not process a pull request for a non-existent builder', async () => {
    const pullRequest: PullRequest = {
      number: 1,
      baseRefName: 'main',
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      title: 'Test PR',
      state: 'CLOSED',
      author: { id: 2, login: 'nonexistentuser' },
      repository: { id: 1, nameWithOwner: 'testuser/testrepo' },
      url: 'https://github.com/testuser/testrepo/pull/1'
    };

    await prisma.githubRepo.create({
      data: {
        id: 1,
        defaultBranch: 'main',
        owner: 'testuser',
        name: 'testrepo'
      }
    });

    const githubEvent = await prisma.githubEvent.findFirst({
      where: { pullRequestNumber: pullRequest.number }
    });
    expect(githubEvent).toBeNull();

    const strike = await prisma.builderStrike.findFirst();
    expect(strike).toBeNull();
  });

  it('should not create a new github event if it was processed before', async () => {
    const builder = await prisma.scout.create({
      data: {
        username: 'testuser',
        displayName: 'Test User',
        builder: true
      }
    });

    const githubUser = await prisma.githubUser.create({
      data: {
        id: 1,
        login: 'testuser',
        builderId: builder.id
      }
    });

    const repo = await prisma.githubRepo.create({
      data: {
        id: 1,
        defaultBranch: 'main',
        owner: 'testuser',
        name: 'testrepo'
      }
    });

    const pullRequest: PullRequest = {
      number: 1,
      baseRefName: 'main',
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      title: 'Test PR',
      state: 'CLOSED',
      author: { id: githubUser.id, login: githubUser.login },
      repository: { id: repo.id, nameWithOwner: `${repo.owner}/${repo.name}` },
      url: 'https://github.com/testuser/testrepo/pull/1'
    };

    await processClosedPullRequest(pullRequest, repo);
    await processClosedPullRequest(pullRequest, repo);
    await processClosedPullRequest(pullRequest, repo);

    const githubEventsCount = await prisma.githubEvent.count({
      where: {
        githubUser: {
          id: githubUser.id
        }
      }
    });
    expect(githubEventsCount).toBe(1);
  });
});
