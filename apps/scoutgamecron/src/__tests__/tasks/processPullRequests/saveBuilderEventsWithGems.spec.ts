import { prisma } from '@charmverse/core/prisma-client';
import { DateTime } from 'luxon';
import { v4 } from 'uuid';

import { saveBuilderEventsWithGems } from '../../../tasks/processPullRequests/saveBuilderEventsWithGems';

describe('saveBuilderEventsWithGems', () => {
  const mockSeason = 1;
  const mockWeek = '20';

  beforeEach(async () => {
    // Clear the database before each test
    await prisma.$transaction([
      prisma.gemsReceipt.deleteMany(),
      prisma.builderStrike.deleteMany(),
      prisma.builderEvent.deleteMany(),
      prisma.githubEvent.deleteMany(),
      prisma.githubUser.deleteMany(),
      prisma.scout.deleteMany(),
      prisma.userWeeklyStats.deleteMany()
    ]);
  });

  it('should process GitHub events, deduplicate them and create builder events, gems receipts, and strikes', async () => {
    const builder = await prisma.scout.create({
      data: {
        username: 'testuser',
        displayName: 'Test User',
        builder: true
      }
    });

    const githubUser = await prisma.githubUser.create({
      data: {
        id: v4(),
        login: 'testuser',
        builderId: builder.id
      }
    });

    const [repo1, repo2] = await Promise.all([
      prisma.githubRepo.create({
        data: {
          id: v4(),
          owner: 'testuser',
          name: 'Test Repo 1'
        }
      }),
      prisma.githubRepo.create({
        data: {
          id: v4(),
          owner: 'testuser',
          name: 'Test Repo 2'
        }
      })
    ]);

    const now = DateTime.now();

    await prisma.githubEvent.createMany({
      data: [
        {
          id: v4(),
          createdBy: githubUser.id,
          type: 'merged_pull_request',
          repoId: repo1.id,
          createdAt: now.toJSDate(),
          pullRequestNumber: 2,
          title: 'Test PR 2'
        },
        // Since this is 30 seconds ago, it should not be included in the deduplication
        {
          id: v4(),
          createdBy: githubUser.id,
          type: 'merged_pull_request',
          repoId: repo1.id,
          createdAt: now.minus({ seconds: 30 }).toJSDate(),
          pullRequestNumber: 1,
          title: 'Test PR 1'
        },
        {
          id: v4(),
          createdBy: githubUser.id,
          type: 'closed_pull_request',
          repoId: repo2.id,
          createdAt: new Date(),
          pullRequestNumber: 1,
          title: 'Test PR 3'
        },
        {
          id: v4(),
          createdBy: githubUser.id,
          type: 'merged_pull_request',
          repoId: repo2.id,
          createdAt: new Date(),
          pullRequestNumber: 2,
          title: 'Test PR 4'
        }
      ]
    });

    await saveBuilderEventsWithGems({ season: mockSeason, week: mockWeek });

    const repo1RegularPrBuilderEvent = await prisma.builderEvent.findFirst({
      where: {
        builderId: builder.id,
        githubEvent: {
          repoId: repo1.id,
          type: 'merged_pull_request',
          pullRequestNumber: 2
        }
      }
    });

    expect(repo1RegularPrBuilderEvent).toBeDefined();

    const repo1DedupedPrBuilderEvent = await prisma.builderEvent.findFirst({
      where: {
        builderId: builder.id,
        githubEvent: {
          repoId: repo1.id,
          type: 'merged_pull_request',
          pullRequestNumber: 1
        }
      }
    });

    expect(repo1DedupedPrBuilderEvent).toBeFalsy();

    const repo2RegularPrBuilderEvent = await prisma.builderEvent.findFirst({
      where: {
        builderId: builder.id,
        githubEvent: {
          repoId: repo2.id,
          type: 'merged_pull_request',
          pullRequestNumber: 2
        }
      }
    });

    expect(repo2RegularPrBuilderEvent).toBeDefined();

    const repo2ClosedPrBuilderEvent = await prisma.builderEvent.findFirstOrThrow({
      where: {
        builderId: builder.id,
        type: 'github_event',
        githubEvent: {
          type: 'closed_pull_request',
          pullRequestNumber: 1,
          repoId: repo2.id
        }
      }
    });

    expect(repo2ClosedPrBuilderEvent).toBeDefined();

    const builderStrikeEvent = await prisma.builderStrike.findFirst({
      where: {
        builderId: builder.id,
        builderEventId: repo2ClosedPrBuilderEvent.id
      }
    });

    expect(builderStrikeEvent).toBeDefined();

    const builderWeeklyStats = await prisma.userWeeklyStats.findFirstOrThrow({
      where: {
        userId: builder.id,
        week: mockWeek
      }
    });

    expect(builderStrikeEvent).toBeDefined();
    expect(builderWeeklyStats.gemsCollected).toBe(2);
  });

  it('should not create builder events, gems receipts and strikes for existing events', async () => {
    // Create test data
    const builder = await prisma.scout.create({
      data: {
        username: 'testuser',
        displayName: 'Test User',
        builder: true
      }
    });

    const githubUser = await prisma.githubUser.create({
      data: {
        id: v4(),
        login: 'testuser',
        builderId: builder.id
      }
    });

    const githubRepo = await prisma.githubRepo.create({
      data: {
        id: v4(),
        owner: 'testuser',
        name: 'Test Repo'
      }
    });

    const mergedPullRequestGithubEvent = await prisma.githubEvent.create({
      data: {
        id: v4(),
        createdBy: githubUser.id,
        type: 'merged_pull_request',
        repoId: githubRepo.id,
        createdAt: new Date(),
        pullRequestNumber: 1,
        title: 'Test PR 1'
      }
    });

    const closedPullRequestGithubEvent = await prisma.githubEvent.create({
      data: {
        id: v4(),
        createdBy: githubUser.id,
        type: 'closed_pull_request',
        repoId: githubRepo.id,
        createdAt: new Date(),
        pullRequestNumber: 2,
        title: 'Test PR 2'
      }
    });

    await Promise.all([
      prisma.builderEvent.create({
        data: {
          builderId: builder.id,
          season: mockSeason,
          week: mockWeek,
          type: 'github_event',
          githubEventId: mergedPullRequestGithubEvent.id
        }
      }),
      prisma.builderEvent.create({
        data: {
          builderId: builder.id,
          season: mockSeason,
          week: mockWeek,
          type: 'github_event',
          githubEventId: closedPullRequestGithubEvent.id
        }
      })
    ]);

    await saveBuilderEventsWithGems({ season: mockSeason, week: mockWeek });

    const builderEvents = await prisma.builderEvent.findMany({
      where: {
        builderId: builder.id
      }
    });
    expect(builderEvents).toHaveLength(2);

    const builderStrikes = await prisma.builderStrike.findMany();
    expect(builderStrikes).toHaveLength(0);

    const gemsReceipts = await prisma.gemsReceipt.findMany();
    expect(gemsReceipts).toHaveLength(0);
  });

  it('should not create builder events for banned builders', async () => {
    const builder = await prisma.scout.create({
      data: {
        username: 'testuser',
        displayName: 'Test User',
        builder: true,
        bannedAt: new Date()
      }
    });

    const githubUser = await prisma.githubUser.create({
      data: {
        id: v4(),
        login: 'testuser',
        builderId: builder.id
      }
    });

    const githubRepo = await prisma.githubRepo.create({
      data: {
        id: v4(),
        owner: 'testuser',
        name: 'Test Repo'
      }
    });

    await prisma.githubEvent.createMany({
      data: [
        {
          id: v4(),
          createdBy: githubUser.id,
          type: 'merged_pull_request',
          repoId: githubRepo.id,
          createdAt: new Date(),
          pullRequestNumber: 1,
          title: 'Test PR 1'
        },
        {
          id: v4(),
          createdBy: githubUser.id,
          type: 'closed_pull_request',
          repoId: githubRepo.id,
          createdAt: new Date(),
          pullRequestNumber: 2,
          title: 'Test PR 2'
        }
      ]
    });

    // Execute function
    await saveBuilderEventsWithGems({ season: mockSeason, week: mockWeek });

    // Verify results
    const builderEvents = await prisma.builderEvent.findMany();
    expect(builderEvents).toHaveLength(0);

    const gemsReceipts = await prisma.gemsReceipt.findMany();
    expect(gemsReceipts).toHaveLength(0);

    // Verify that no additional strikes were created
    const builderStrikes = await prisma.builderStrike.findMany();
    expect(builderStrikes).toHaveLength(0);
  });

  it('should create a third_pr_in_streak gems receipt for the third merged PR in a streak', async () => {
    // Create test data
    const builder = await prisma.scout.create({
      data: {
        username: 'testuser',
        displayName: 'Test User',
        builder: true
      }
    });

    const githubUser = await prisma.githubUser.create({
      data: {
        id: v4(),
        login: 'testuser',
        builderId: builder.id
      }
    });

    const githubRepo = await prisma.githubRepo.create({
      data: {
        id: v4(),
        owner: 'testuser',
        name: 'Test Repo'
      }
    });

    await prisma.githubEvent.create({
      data: {
        id: v4(),
        createdBy: githubUser.id,
        type: 'merged_pull_request',
        repoId: githubRepo.id,
        // Start of week
        createdAt: DateTime.now().startOf('week').toJSDate(),
        pullRequestNumber: 1,
        title: 'Test PR 1'
      }
    });

    await prisma.githubEvent.create({
      data: {
        id: v4(),
        createdBy: githubUser.id,
        type: 'merged_pull_request',
        repoId: githubRepo.id,
        createdAt: DateTime.now().startOf('week').plus({ days: 1 }).toJSDate(),
        pullRequestNumber: 2,
        title: 'Test PR 2'
      }
    });

    await saveBuilderEventsWithGems({ season: mockSeason, week: mockWeek });

    const thirdPullRequestGithubEvent = await prisma.githubEvent.create({
      data: {
        id: v4(),
        createdBy: githubUser.id,
        type: 'merged_pull_request',
        repoId: githubRepo.id,
        createdAt: DateTime.now().startOf('week').plus({ days: 2 }).toJSDate(),
        pullRequestNumber: 3,
        title: 'Test PR 3'
      }
    });

    await saveBuilderEventsWithGems({ season: mockSeason, week: mockWeek });

    const builderEvents = await prisma.builderEvent.findMany({
      where: {
        builderId: builder.id
      }
    });
    expect(builderEvents).toHaveLength(3);

    const thirdPrInStreakBuilderEvent = builderEvents.find(
      (event) => event.type === 'github_event' && event.githubEventId === thirdPullRequestGithubEvent.id
    );

    expect(thirdPrInStreakBuilderEvent).toBeDefined();

    const gemsReceipt = await prisma.gemsReceipt.findFirstOrThrow({
      where: {
        eventId: thirdPrInStreakBuilderEvent?.id
      }
    });

    expect(gemsReceipt).toMatchObject({
      type: 'third_pr_in_streak',
      value: 3
    });
  });

  it('should ban a builder after 3 strikes', async () => {
    // Create test data
    const builder = await prisma.scout.create({
      data: {
        username: 'testuser',
        displayName: 'Test User',
        builder: true
      }
    });

    const githubUser = await prisma.githubUser.create({
      data: {
        id: v4(),
        login: 'testuser',
        builderId: builder.id
      }
    });

    const githubRepo = await prisma.githubRepo.create({
      data: {
        id: v4(),
        owner: 'testuser',
        name: 'Test Repo'
      }
    });

    await prisma.githubEvent.createMany({
      data: [
        {
          id: v4(),
          createdBy: githubUser.id,
          type: 'closed_pull_request',
          repoId: githubRepo.id,
          createdAt: DateTime.now().startOf('week').toJSDate(),
          pullRequestNumber: 1,
          title: 'Test PR 1'
        },
        {
          id: v4(),
          createdBy: githubUser.id,
          type: 'closed_pull_request',
          repoId: githubRepo.id,
          createdAt: DateTime.now().startOf('week').plus({ days: 1 }).toJSDate(),
          pullRequestNumber: 2,
          title: 'Test PR 2'
        }
      ]
    });

    await saveBuilderEventsWithGems({ season: mockSeason, week: mockWeek });

    await prisma.githubEvent.create({
      data: {
        id: v4(),
        createdBy: githubUser.id,
        type: 'closed_pull_request',
        repoId: githubRepo.id,
        createdAt: DateTime.now().startOf('week').plus({ days: 2 }).toJSDate(),
        pullRequestNumber: 3,
        title: 'Test PR 3'
      }
    });

    await saveBuilderEventsWithGems({ season: mockSeason, week: mockWeek });

    const builderEvents = await prisma.builderEvent.findMany({
      where: {
        builderId: builder.id
      }
    });
    expect(builderEvents).toHaveLength(3);

    const gemsReceipts = await prisma.gemsReceipt.findMany({
      where: {
        event: {
          builderId: builder.id
        }
      }
    });
    expect(gemsReceipts).toHaveLength(0);

    const builderStrikes = await prisma.builderStrike.findMany({
      where: {
        builderId: builder.id
      }
    });
    expect(builderStrikes).toHaveLength(3);

    const bannedScout = await prisma.scout.findUniqueOrThrow({
      where: { id: builder.id }
    });
    expect(bannedScout.bannedAt).toBeTruthy();
  });
});
