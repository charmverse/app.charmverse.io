import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { mockBuilder, mockBuilderNft, mockRepo, mockScout } from '@packages/scoutgame/testing/database';
import { randomLargeInt } from '@packages/scoutgame/testing/generators';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { mockCommit } from '@/testing/generators';

const currentSeason = '2024-W40';

const { recordCommit } = await import('../recordCommit');

describe('recordCommit', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should create builder events and gems receipts for a first commit of the day', async () => {
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

    const commit = mockCommit({
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      author: builder.githubUser,
      repo
    });

    await recordCommit({ commit, season: currentSeason });

    const githubEvent = await prisma.githubEvent.findFirst({
      where: {
        repoId: repo.id,
        type: 'commit',
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
        type: 'daily_commit',
        gemsReceiptId: gemsReceipt?.id,
        recipientType: 'builder'
      }
    });

    expect(builderActivities).toBe(1);

    const scoutActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout.id,
        type: 'daily_commit',
        gemsReceiptId: gemsReceipt?.id,
        recipientType: 'scout'
      }
    });

    expect(scoutActivities).toBe(1);
  });

  it('should create builder events and gems receipts for a regular merged pull request', async () => {
    const builder = await mockBuilder();

    const repo = await mockRepo();

    const commit = mockCommit({
      completedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      repo,
      author: builder.githubUser
    });
    const scout = await mockScout();

    await mockBuilderNft({
      builderId: builder.id,
      season: currentSeason,
      owners: [scout]
    });

    await recordCommit({ commit, season: currentSeason });

    const githubEvent = await prisma.githubEvent.findFirst({
      where: {
        repoId: repo.id,
        type: 'commit',
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
        type: 'daily_commit',
        gemsReceiptId: gemsReceipt?.id,
        recipientType: 'builder'
      }
    });
    expect(builderActivities).toBe(1);

    const scoutActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout.id,
        type: 'daily_commit',
        gemsReceiptId: gemsReceipt?.id,
        recipientType: 'scout'
      }
    });
    expect(scoutActivities).toBe(1);
  });

  it('should only create one builder event per repo per day', async () => {
    const builder = await mockBuilder();
    const repo = await mockRepo();

    const now = DateTime.local({ zone: 'utc' });

    const firstCommit = mockCommit({
      createdAt: now.toISO(),
      author: builder.githubUser,
      repo
    });

    // record a builder event for the last week PR, use a different date so that it creates a builder event for the last week
    await recordCommit({
      commit: firstCommit,
      season: currentSeason,
      now
    });

    const secondCommit = mockCommit({
      createdAt: now.toISO(),
      repo,
      author: builder.githubUser
    });

    await recordCommit({ commit: secondCommit, season: currentSeason, now });

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      }
    });
    expect(gemsReceipts).toHaveLength(1);
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

    const commit = mockCommit({
      completedAt: new Date().toISOString(),
      createdAt: DateTime.fromJSDate(new Date(), { zone: 'utc' }).minus({ days: 3 }).toISO(),
      repo,
      author: builder.githubUser
    });

    await recordCommit({ commit, season: currentSeason });

    await recordCommit({ commit, season: currentSeason });

    const builderEvents = await prisma.builderEvent.count({
      where: {
        builderId: builder.id,
        type: 'daily_commit'
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
});
