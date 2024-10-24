import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import {
  mockBuilder,
  mockBuilderNft,
  mockNFTPurchaseEvent,
  mockRepo,
  mockScout
} from '@packages/scoutgame/testing/database';
import { randomLargeInt } from '@packages/scoutgame/testing/generators';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { mockPullRequest } from '@/testing/generators';

const currentSeason = '2024-W40';

jest.unstable_mockModule('../github/getRecentPullRequestsByUser', () => ({
  getRecentPullRequestsByUser: jest.fn()
}));

const { recordMergedPullRequest } = await import('../recordMergedPullRequest');
const { getRecentPullRequestsByUser } = await import('../github/getRecentPullRequestsByUser');

describe('recordMergedPullRequest', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should create builder events and gems receipts for a first merged pull request', async () => {
    const repoId = randomLargeInt();
    const username = v4();

    const builder = await mockBuilder();
    const scout = await mockScout();

    await mockBuilderNft({
      builderId: builder.id,
      season: currentSeason,
      owners: [scout]
    });

    const repo = await mockRepo({
      id: repoId,
      owner: username,
      name: 'Test-Repo',
      defaultBranch: 'main'
    });

    const pullRequest = mockPullRequest({
      mergedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([]);

    await recordMergedPullRequest({ pullRequest, repo, season: currentSeason });

    const githubEvent = await prisma.githubEvent.findFirst({
      where: {
        repoId: repo.id,
        pullRequestNumber: pullRequest.number,
        type: 'merged_pull_request',
        createdBy: builder.githubUser.id
      }
    });

    expect(githubEvent).toBeDefined();

    const builderEvent = await prisma.builderEvent.findFirst({
      where: {
        builderId: builder.id
      }
    });

    expect(builderEvent).toBeDefined();

    const gemsReceipt = await prisma.gemsReceipt.findFirst({
      where: {
        eventId: builderEvent?.id
      }
    });

    expect(gemsReceipt).toBeDefined();

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'gems_first_pr',
        gemsReceiptId: gemsReceipt?.id,
        recipientType: 'builder'
      }
    });

    expect(builderActivities).toBe(1);

    const scoutActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout.id,
        type: 'gems_first_pr',
        gemsReceiptId: gemsReceipt?.id,
        recipientType: 'scout'
      }
    });

    expect(scoutActivities).toBe(1);
  });

  it('should register a partner bonus', async () => {
    const builder = await mockBuilder();

    const repo = await mockRepo({
      bonusPartner: 'test-partner',
      name: 'Test-Repo',
      defaultBranch: 'main'
    });

    const pullRequest = mockPullRequest({
      mergedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([]);

    await recordMergedPullRequest({ pullRequest, repo, season: currentSeason });

    const builderEvent = await prisma.builderEvent.findFirst({
      where: {
        builderId: builder.id
      }
    });

    expect(builderEvent).toBeDefined();
    expect(builderEvent?.bonusPartner).toBe('test-partner');
  });

  it('should create builder events and gems receipts for a regular merged pull request', async () => {
    const builder = await mockBuilder();

    const repo = await mockRepo();

    const pullRequest = mockPullRequest({
      mergedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      repo,
      state: 'MERGED',
      author: builder.githubUser
    });

    const scout = await mockScout();
    await mockBuilderNft({
      builderId: builder.id,
      season: currentSeason,
      owners: [scout]
    });

    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([
      mockPullRequest()
    ]);

    await recordMergedPullRequest({ pullRequest, repo, season: currentSeason });

    const githubEvent = await prisma.githubEvent.findFirst({
      where: {
        repoId: repo.id,
        pullRequestNumber: pullRequest.number,
        type: 'merged_pull_request',
        createdBy: builder.githubUser.id
      }
    });

    expect(githubEvent).toBeDefined();

    const builderEvent = await prisma.builderEvent.findFirst({
      where: {
        builderId: builder.id
      }
    });

    expect(builderEvent).toBeDefined();

    const gemsReceipt = await prisma.gemsReceipt.findFirst({
      where: {
        eventId: builderEvent?.id
      }
    });

    expect(gemsReceipt).toBeDefined();

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'gems_regular_pr',
        gemsReceiptId: gemsReceipt?.id,
        recipientType: 'builder'
      }
    });
    expect(builderActivities).toBe(1);

    const scoutActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout.id,
        type: 'gems_regular_pr',
        gemsReceiptId: gemsReceipt?.id,
        recipientType: 'scout'
      }
    });
    expect(scoutActivities).toBe(1);
  });

  it('should create builder events and gems receipts for a 3 merged PR streak', async () => {
    const builder = await mockBuilder();
    const repo = await mockRepo();
    const scout = await mockScout();
    await mockBuilderNft({
      builderId: builder.id,
      season: currentSeason,
      owners: [scout]
    });

    const now = DateTime.fromObject({ weekday: 3 }, { zone: 'utc' }); // 1 is Monday and 7 is Sunday

    const lastWeekPr = mockPullRequest({
      createdAt: now.minus({ days: 4 }).toISO(),
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([
      mockPullRequest()
    ]);

    // record a builder event for the last week PR, use a different date so that it creates a builder event for the last week
    await recordMergedPullRequest({
      pullRequest: lastWeekPr,
      repo,
      season: currentSeason,
      now: DateTime.fromISO(lastWeekPr.createdAt, { zone: 'utc' })
    });

    const pullRequest2 = mockPullRequest({
      createdAt: now.minus({ days: 2 }).toISO(),
      state: 'MERGED',
      repo,
      author: builder.githubUser
    });

    await recordMergedPullRequest({ pullRequest: pullRequest2, repo, season: currentSeason, now });

    const pullRequest3 = mockPullRequest({
      createdAt: now.toISO(),
      state: 'MERGED',
      repo,
      author: builder.githubUser
    });

    await recordMergedPullRequest({ pullRequest: pullRequest3, repo, season: currentSeason, now });

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      }
    });
    expect(gemsReceipts).toHaveLength(3);

    const gemsReceipt = await prisma.gemsReceipt.findFirst({
      where: {
        type: 'third_pr_in_streak'
      }
    });

    expect(gemsReceipt).toBeDefined();

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'gems_third_pr_in_streak',
        gemsReceiptId: gemsReceipt?.id,
        recipientType: 'builder'
      }
    });
    expect(builderActivities).toBe(1);

    const scoutActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout.id,
        type: 'gems_third_pr_in_streak',
        gemsReceiptId: gemsReceipt?.id,
        recipientType: 'scout'
      }
    });
    expect(scoutActivities).toBe(1);
  });

  it('should only create one builder event per repo per day', async () => {
    const builder = await mockBuilder();
    const repo = await mockRepo();

    const now = DateTime.fromObject({ weekday: 3 }, { zone: 'utc' }); // 1 is Monday and 7 is Sunday

    const lastWeekPr = mockPullRequest({
      createdAt: now.minus({ days: 2 }).toISO(),
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([
      mockPullRequest()
    ]);

    // record a builder event for the last week PR, use a different date so that it creates a builder event for the last week
    await recordMergedPullRequest({
      pullRequest: lastWeekPr,
      repo,
      season: currentSeason,
      now: DateTime.fromISO(lastWeekPr.createdAt, { zone: 'utc' })
    });

    const pullRequest2 = mockPullRequest({
      createdAt: now.minus({ days: 2 }).toISO(),
      state: 'MERGED',
      repo,
      author: builder.githubUser
    });

    await recordMergedPullRequest({ pullRequest: pullRequest2, repo, season: currentSeason, now });

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      }
    });
    expect(gemsReceipts).toHaveLength(1);
  });

  it('should  create two builder events on the same day for different repos', async () => {
    const builder = await mockBuilder();
    const repo = await mockRepo();
    const repo2 = await mockRepo();

    const now = DateTime.fromObject({ weekday: 3 }, { zone: 'utc' }); // 1 is Monday and 7 is Sunday

    const lastWeekPr = mockPullRequest({
      createdAt: now.minus({ days: 2 }).toISO(),
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([
      mockPullRequest()
    ]);

    // record a builder event for the last week PR, use a different date so that it creates a builder event for the last week
    await recordMergedPullRequest({
      pullRequest: lastWeekPr,
      repo,
      season: currentSeason,
      now: DateTime.fromISO(lastWeekPr.createdAt, { zone: 'utc' })
    });

    const pullRequest2 = mockPullRequest({
      createdAt: now.minus({ days: 2 }).toISO(),
      state: 'MERGED',
      repo: repo2,
      author: builder.githubUser
    });

    await recordMergedPullRequest({ pullRequest: pullRequest2, repo: repo2, season: currentSeason, now });

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      }
    });
    expect(gemsReceipts).toHaveLength(2);
  });

  it('should not create builder events and gems receipts for existing events', async () => {
    const builder = await mockBuilder();
    const repo = await mockRepo();
    const scout = await mockScout();
    await mockBuilderNft({
      builderId: builder.id,
      season: currentSeason,
      owners: [scout]
    });

    const pullRequest = mockPullRequest({
      mergedAt: new Date().toISOString(),
      createdAt: DateTime.fromJSDate(new Date(), { zone: 'utc' }).minus({ days: 3 }).toISO(),
      repo,
      state: 'MERGED',
      author: builder.githubUser
    });
    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([]);

    await recordMergedPullRequest({ pullRequest, repo, season: currentSeason });

    await recordMergedPullRequest({ pullRequest, repo, season: currentSeason });

    const builderEvents = await prisma.builderEvent.count({
      where: {
        builderId: builder.id,
        type: 'merged_pull_request'
      }
    });
    expect(builderEvents).toBe(1);

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      }
    });
    expect(gemsReceipts).toHaveLength(1);

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        gemsReceiptId: gemsReceipts[0].id,
        recipientType: 'builder'
      }
    });
    expect(builderActivities).toBe(1);

    const scoutActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout.id,
        gemsReceiptId: gemsReceipts[0].id,
        recipientType: 'scout'
      }
    });
    expect(scoutActivities).toBe(1);
  });

  it('should not create builder events for banned builders', async () => {
    const builder = await mockBuilder({
      builderStatus: 'banned'
    });
    const scout = await mockScout();
    await mockBuilderNft({
      builderId: builder.id,
      season: currentSeason,
      owners: [scout]
    });

    const repo = await mockRepo();

    const pullRequest = mockPullRequest({
      mergedAt: new Date().toISOString(),
      createdAt: DateTime.fromJSDate(new Date(), { zone: 'utc' }).minus({ days: 3 }).toISO(),
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([]);

    await recordMergedPullRequest({ pullRequest, repo, season: currentSeason });

    const builderEvents = await prisma.builderEvent.findMany({
      where: {
        builderId: builder.id,
        type: 'merged_pull_request'
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

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        recipientType: 'builder'
      }
    });
    expect(builderActivities).toBe(0);

    const scoutActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout.id,
        recipientType: 'scout'
      }
    });
    expect(scoutActivities).toBe(0);
  });
});
