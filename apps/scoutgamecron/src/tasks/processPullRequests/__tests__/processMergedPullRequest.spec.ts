import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { timezone } from '@packages/scoutgame/utils';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import type { PullRequest } from '../getPullRequests';

// Function to generate random large integers
const randomLargeInt = () => Math.floor(Math.random() * 1000000000) + 1000000000;

jest.unstable_mockModule('../getRecentPullRequestsByUser', () => ({
  getRecentPullRequestsByUser: jest.fn()
}));

const { processMergedPullRequest } = await import('../processMergedPullRequest');
const { getRecentPullRequestsByUser } = await import('../getRecentPullRequestsByUser');

describe('processMergedPullRequest', () => {
  beforeEach(async () => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should create builder events, gems receipts and update weekly stats for a first merged pull request', async () => {
    const repoId = randomLargeInt();
    const prNumber = randomLargeInt();
    const githubUserId = randomLargeInt();
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
        owner: username,
        name: 'Test-Repo',
        defaultBranch: 'main'
      }
    });

    const pullRequest: PullRequest = {
      number: prNumber,
      baseRefName: 'main',
      mergedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      repository: {
        id: repoId,
        nameWithOwner: `${repo.owner}/${repo.name}`
      },
      title: 'Test PR 1',
      url: `https://github.com/${username}/Test-Repo/pull/${prNumber}`,
      state: 'MERGED',
      author: {
        id: githubUserId,
        login: username
      }
    };

    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([]);

    await processMergedPullRequest(pullRequest, repo);

    const githubEvent = await prisma.githubEvent.findFirst({
      where: {
        repoId: repo.id,
        pullRequestNumber: pullRequest.number,
        type: 'merged_pull_request',
        createdBy: githubUser.id
      }
    });

    expect(githubEvent).toBeDefined();

    const builderEvent = await prisma.builderEvent.findFirstOrThrow({
      where: {
        builderId: builder.id
      }
    });

    expect(builderEvent).toBeDefined();

    const gemsReceipt = await prisma.gemsReceipt.findFirstOrThrow({
      where: {
        eventId: builderEvent.id
      }
    });

    expect(gemsReceipt).toBeDefined();

    const builderWeeklyStats = await prisma.userWeeklyStats.findFirstOrThrow({
      where: {
        userId: builder.id
      }
    });

    expect(builderWeeklyStats.gemsCollected).toBe(10);
  });

  it('should create builder events, gems receipts and update weekly stats for a regular merged pull request', async () => {
    const repoId = randomLargeInt();
    const prNumber = randomLargeInt();
    const githubUserId = randomLargeInt();
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
        owner: username,
        name: 'Test-Repo',
        defaultBranch: 'main'
      }
    });

    const pullRequest: PullRequest = {
      number: prNumber,
      baseRefName: 'main',
      mergedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      repository: {
        id: repoId,
        nameWithOwner: `${repo.owner}/${repo.name}`
      },
      title: 'Test PR 2',
      url: `https://github.com/${username}/Test-Repo/pull/${prNumber}`,
      state: 'MERGED',
      author: {
        id: githubUserId,
        login: username
      }
    };
    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([
      {
        number: randomLargeInt(),
        baseRefName: 'main',
        mergedAt: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        closedAt: new Date().toISOString(),
        state: 'MERGED',
        title: 'Test PR 1',
        url: `https://github.com/${username}/Test-Repo/pull/${randomLargeInt()}`
      }
    ]);

    await processMergedPullRequest(pullRequest, repo);

    const githubEvent = await prisma.githubEvent.findFirst({
      where: {
        repoId: repo.id,
        pullRequestNumber: pullRequest.number,
        type: 'merged_pull_request',
        createdBy: githubUser.id
      }
    });

    expect(githubEvent).toBeDefined();

    const builderEvent = await prisma.builderEvent.findFirstOrThrow({
      where: {
        builderId: builder.id
      }
    });

    expect(builderEvent).toBeDefined();

    const gemsReceipt = await prisma.gemsReceipt.findFirstOrThrow({
      where: {
        eventId: builderEvent.id
      }
    });

    expect(gemsReceipt).toBeDefined();

    const builderWeeklyStats = await prisma.userWeeklyStats.findFirstOrThrow({
      where: {
        userId: builder.id
      }
    });

    expect(builderWeeklyStats.gemsCollected).toBe(1);
  });

  it('should create builder events, gems receipts and update weekly stats for a 3 merged PR streak', async () => {
    const repoId = randomLargeInt();
    const githubUserId = randomLargeInt();
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
        owner: username,
        name: 'Test-Repo',
        defaultBranch: 'main'
      }
    });

    const pullRequest2: PullRequest = {
      number: randomLargeInt(),
      baseRefName: 'main',
      mergedAt: new Date().toISOString(),
      createdAt: DateTime.fromJSDate(new Date(), { zone: timezone }).minus({ days: 3 }).toISO(),
      repository: {
        id: repoId,
        nameWithOwner: `${repo.owner}/${repo.name}`
      },
      title: 'Test PR 2',
      url: `https://github.com/${username}/Test-Repo/pull/${randomLargeInt()}`,
      state: 'MERGED',
      author: {
        id: githubUserId,
        login: username
      }
    };
    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([
      {
        number: randomLargeInt(),
        baseRefName: 'main',
        mergedAt: new Date().toISOString(),
        createdAt: DateTime.fromJSDate(new Date(), { zone: timezone }).minus({ days: 2 }).toISO(),
        closedAt: new Date().toISOString(),
        state: 'MERGED',
        title: 'Test PR 1',
        url: `https://github.com/${username}/Test-Repo/pull/${randomLargeInt()}`
      }
    ]);

    await processMergedPullRequest(pullRequest2, repo);

    const pullRequest3: PullRequest = {
      number: randomLargeInt(),
      baseRefName: 'main',
      mergedAt: new Date().toISOString(),
      createdAt: DateTime.fromJSDate(new Date(), { zone: timezone }).minus({ days: 1 }).toISO(),
      author: {
        id: githubUserId,
        login: username
      },
      repository: {
        id: repoId,
        nameWithOwner: `${repo.owner}/${repo.name}`
      },
      title: 'Test PR 3',
      url: `https://github.com/${username}/Test-Repo/pull/${randomLargeInt()}`,
      state: 'MERGED'
    };

    await processMergedPullRequest(pullRequest3, repo);

    const pullRequest4: PullRequest = {
      number: randomLargeInt(),
      baseRefName: 'main',
      mergedAt: DateTime.now().startOf('day').toISO(),
      createdAt: DateTime.fromJSDate(new Date(), { zone: timezone }).toISO(),
      author: {
        id: githubUserId,
        login: username
      },
      repository: {
        id: repoId,
        nameWithOwner: `${repo.owner}/${repo.name}`
      },
      title: 'Test PR 4',
      url: `https://github.com/${username}/Test-Repo/pull/${randomLargeInt()}`,
      state: 'MERGED'
    };

    await processMergedPullRequest(pullRequest4, repo);

    const gemsReceipt = await prisma.gemsReceipt.findFirstOrThrow({
      where: {
        type: 'third_pr_in_streak'
      }
    });

    expect(gemsReceipt).toBeDefined();

    const builderWeeklyStats = await prisma.userWeeklyStats.findFirstOrThrow({
      where: {
        userId: builder.id
      }
    });

    expect(builderWeeklyStats.gemsCollected).toBe(5);
  });

  it('should not create builder events and gems receipts for existing events', async () => {
    const repoId = randomLargeInt();
    const prNumber = randomLargeInt();
    const githubUserId = randomLargeInt();
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

    const githubRepo = await prisma.githubRepo.create({
      data: {
        id: repoId,
        owner: username,
        name: 'Test Repo',
        defaultBranch: 'main'
      }
    });

    const pullRequest: PullRequest = {
      number: prNumber,
      baseRefName: 'main',
      mergedAt: new Date().toISOString(),
      createdAt: DateTime.fromJSDate(new Date(), { zone: timezone }).minus({ days: 3 }).toISO(),
      repository: {
        id: repoId,
        nameWithOwner: `${githubRepo.owner}/${githubRepo.name}`
      },
      title: 'Test PR 1',
      url: `https://github.com/${username}/Test-Repo/pull/${prNumber}`,
      state: 'MERGED',
      author: {
        id: githubUserId,
        login: username
      }
    };
    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([]);

    await processMergedPullRequest(pullRequest, githubRepo);

    await processMergedPullRequest(pullRequest, githubRepo);

    await processMergedPullRequest(pullRequest, githubRepo);

    const builderEvents = await prisma.builderEvent.count({
      where: {
        builderId: builder.id
      }
    });
    expect(builderEvents).toBe(1);

    const gemsReceipts = await prisma.gemsReceipt.count({
      where: {
        event: {
          builderId: builder.id
        }
      }
    });
    expect(gemsReceipts).toBe(1);
  });

  it('should not create builder events for banned builders', async () => {
    const repoId = randomLargeInt();
    const prNumber = randomLargeInt();
    const githubUserId = randomLargeInt();
    const username = v4();

    const builder = await prisma.scout.create({
      data: {
        username,
        displayName: 'Test User',
        builder: true,
        bannedAt: new Date()
      }
    });

    const githubUser = await prisma.githubUser.create({
      data: {
        id: githubUserId,
        login: username,
        builderId: builder.id
      }
    });

    const githubRepo = await prisma.githubRepo.create({
      data: {
        id: repoId,
        owner: username,
        name: 'Test Repo',
        defaultBranch: 'main'
      }
    });

    const pullRequest: PullRequest = {
      number: prNumber,
      baseRefName: 'main',
      mergedAt: new Date().toISOString(),
      createdAt: DateTime.fromJSDate(new Date(), { zone: timezone }).minus({ days: 3 }).toISO(),
      repository: {
        id: repoId,
        nameWithOwner: `${githubRepo.owner}/${githubRepo.name}`
      },
      title: 'Test PR 1',
      url: `https://github.com/${username}/Test-Repo/pull/${prNumber}`,
      state: 'MERGED',
      author: {
        id: githubUserId,
        login: username
      }
    };
    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([]);

    await processMergedPullRequest(pullRequest, githubRepo);

    const builderEvents = await prisma.builderEvent.findMany({
      where: {
        builderId: builder.id
      }
    });
    expect(builderEvents).toHaveLength(0);

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      }
    });
    expect(gemsReceipts).toHaveLength(0);
  });
});
