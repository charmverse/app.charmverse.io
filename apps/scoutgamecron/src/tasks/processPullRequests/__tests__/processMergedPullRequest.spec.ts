import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { timezone } from '@packages/scoutgame/utils';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { mockBuilder, mockRepo } from '@/testing/database';
import { mockPullRequest, randomLargeInt } from '@/testing/generators';

jest.unstable_mockModule('../getRecentPullRequestsByUser', () => ({
  getRecentPullRequestsByUser: jest.fn()
}));

const { processMergedPullRequest } = await import('../processMergedPullRequest');
const { getRecentPullRequestsByUser } = await import('../getRecentPullRequestsByUser');

describe('processMergedPullRequest', () => {
  beforeEach(() => {
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
    const builder = await mockBuilder();

    const repo = await mockRepo();

    const pullRequest = mockPullRequest({
      mergedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      repo,
      state: 'MERGED',
      author: builder.githubUser
    });

    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([
      mockPullRequest()
    ]);

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

    expect(builderWeeklyStats.gemsCollected).toBe(1);
  });

  it('should create builder events, gems receipts and update weekly stats for a 3 merged PR streak', async () => {
    const builder = await mockBuilder();
    const repo = await mockRepo();

    const now = DateTime.fromObject({ weekday: 2 }, { zone: timezone });

    const pullRequest2 = mockPullRequest({
      createdAt: now.minus({ days: 4 }).toISO(),
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([
      mockPullRequest()
    ]);

    await processMergedPullRequest({ pullRequest: pullRequest2, repo, now: now.toJSDate() });

    const pullRequest3 = mockPullRequest({
      createdAt: now.minus({ days: 1 }).toISO(),
      state: 'MERGED',
      repo,
      author: builder.githubUser
    });

    await processMergedPullRequest({ pullRequest: pullRequest3, repo, now: now.toJSDate() });

    const pullRequest4 = mockPullRequest({
      createdAt: now.toISO(),
      state: 'MERGED',
      repo,
      author: builder.githubUser
    });

    await processMergedPullRequest({ pullRequest: pullRequest4, repo, now: now.toJSDate() });

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

    // The total is 4 because the first PR is from a previous week, but the 3rd PR counts as a streak, so 3 + 1 = 4
    expect(builderWeeklyStats.gemsCollected).toBe(4);
  });

  it('should not create builder events and gems receipts for existing events', async () => {
    const builder = await mockBuilder();
    const repo = await mockRepo();

    const pullRequest = mockPullRequest({
      mergedAt: new Date().toISOString(),
      createdAt: DateTime.fromJSDate(new Date(), { zone: timezone }).minus({ days: 3 }).toISO(),
      repo,
      state: 'MERGED',
      author: builder.githubUser
    });
    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([]);

    await processMergedPullRequest({ pullRequest, repo });

    await processMergedPullRequest({ pullRequest, repo });

    await processMergedPullRequest({ pullRequest, repo });

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
