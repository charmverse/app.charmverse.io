import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { timezone } from '@packages/scoutgame/utils';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import type { PullRequest } from '../getPullRequests';

import { mockBuilder, mockRepo } from '@/testing/database';
import { mockPullRequest, randomLargeInt } from '@/testing/generators';

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
    const username = v4();

    const builder = await mockBuilder();

    const repo = await prisma.githubRepo.create({
      data: {
        id: repoId,
        owner: username,
        name: 'Test-Repo',
        defaultBranch: 'main'
      }
    });

    const pullRequest = mockPullRequest({
      mergedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([]);

    await processMergedPullRequest({ pullRequest, repo });

    const githubEvent = await prisma.githubEvent.findFirst({
      where: {
        repoId: repo.id,
        pullRequestNumber: pullRequest.number,
        type: 'merged_pull_request',
        createdBy: builder.githubUser.id
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

    await processMergedPullRequest({ pullRequest, repo });

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
    const builder = await mockBuilder();
    const repo = await mockRepo();

    const pullRequest2 = mockPullRequest({
      createdAt: DateTime.fromJSDate(new Date(), { zone: timezone }).minus({ days: 3 }).toISO(),
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([
      {
        number: randomLargeInt(),
        baseRefName: 'main',
        mergedAt: new Date().toISOString(),
        createdAt: DateTime.fromJSDate(new Date(), { zone: timezone }).minus({ days: 2 }).toISO(),
        closedAt: new Date().toISOString(),
        state: 'MERGED',
        title: 'Test PR 1',
        url: `https://github.com/${repo.owner}/${repo.name}/pull/${randomLargeInt()}`
      }
    ]);

    await processMergedPullRequest({ pullRequest: pullRequest2, repo });

    const pullRequest3 = mockPullRequest({
      createdAt: DateTime.fromJSDate(new Date(), { zone: timezone }).minus({ days: 1 }).toISO(),
      state: 'MERGED',
      repo,
      author: builder.githubUser
    });

    await processMergedPullRequest({ pullRequest: pullRequest3, repo });

    const pullRequest4 = mockPullRequest({
      createdAt: DateTime.fromJSDate(new Date(), { zone: timezone }).toISO(),
      state: 'MERGED',
      repo,
      author: builder.githubUser
    });

    await processMergedPullRequest({ pullRequest: pullRequest4, repo });

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

    await processMergedPullRequest({ pullRequest, repo: githubRepo });

    await processMergedPullRequest({ pullRequest, repo: githubRepo });

    await processMergedPullRequest({ pullRequest, repo: githubRepo });

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
    const builder = await mockBuilder({
      bannedAt: new Date()
    });

    const repo = await mockRepo();

    const pullRequest = mockPullRequest({
      mergedAt: new Date().toISOString(),
      createdAt: DateTime.fromJSDate(new Date(), { zone: timezone }).minus({ days: 3 }).toISO(),
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([]);

    await processMergedPullRequest({ pullRequest, repo });

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
