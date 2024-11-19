import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import { mockBuilder, mockBuilderNft, mockRepo, mockScout } from '@packages/scoutgame/testing/database';
import { randomLargeInt, mockSeason } from '@packages/scoutgame/testing/generators';
import { v4 } from 'uuid';

import { mockPullRequest } from '@/testing/generators';

jest.unstable_mockModule('../github/getClosedPullRequest', () => ({
  getClosedPullRequest: jest.fn()
}));

const { getClosedPullRequest } = await import('../github/getClosedPullRequest');
const { recordClosedPullRequest } = await import('../recordClosedPullRequest');

describe('recordClosedPullRequest', () => {
  beforeEach(async () => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should process a closed pull request and create a strike', async () => {
    const builder = await mockBuilder();
    const repo = await mockRepo();
    const scout = await mockScout();

    await mockBuilderNft({ builderId: builder.id, owners: [scout] });

    const pullRequest = mockPullRequest({
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      state: 'CLOSED',
      author: builder.githubUser,
      repo
    });

    (getClosedPullRequest as jest.Mock<typeof getClosedPullRequest>).mockResolvedValue({ login: v4() });
    await recordClosedPullRequest({ pullRequest, repo, season: mockSeason });

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

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'builder_strike',
        recipientType: 'builder'
      }
    });
    expect(builderActivities).toBe(1);

    const scoutActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout.id,
        type: 'builder_strike',
        recipientType: 'scout'
      }
    });
    expect(scoutActivities).toBe(1);
  });

  it('should not create a strike if the PR was closed by the author', async () => {
    const builder = await mockBuilder();
    const scout = await mockScout();
    const repo = await mockRepo();

    await mockBuilderNft({ builderId: builder.id, owners: [scout] });

    const pullRequest = mockPullRequest({
      state: 'CLOSED',
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      author: builder.githubUser,
      repo
    });

    (getClosedPullRequest as jest.Mock<typeof getClosedPullRequest>).mockResolvedValue(builder.githubUser);

    await recordClosedPullRequest({ pullRequest, repo, season: mockSeason });

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

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'builder_strike',
        recipientType: 'builder'
      }
    });
    expect(builderActivities).toBe(0);

    const scoutActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout.id,
        type: 'builder_strike',
        recipientType: 'scout'
      }
    });
    expect(scoutActivities).toBe(0);
  });

  it('should ban a builder after 3 strikes', async () => {
    const builder = await mockBuilder();
    const scout = await mockScout();
    const repo = await mockRepo();

    await mockBuilderNft({ builderId: builder.id, owners: [scout] });

    const pullRequest = mockPullRequest({
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      state: 'CLOSED',
      author: builder.githubUser,
      repo
    });

    (getClosedPullRequest as jest.Mock<typeof getClosedPullRequest>).mockResolvedValue({ login: v4() });

    for (let i = 0; i < 3; i++) {
      await recordClosedPullRequest({ pullRequest: { ...pullRequest, number: i + 1 }, repo, season: mockSeason });
    }

    const strikes = await prisma.builderStrike.findMany({
      where: { builderId: builder.id }
    });
    expect(strikes).toHaveLength(3);

    const bannedBuilder = await prisma.scout.findUniqueOrThrow({
      where: { id: builder.id }
    });
    expect(bannedBuilder.builderStatus).toEqual('banned');

    const builderStrikeActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'builder_strike',
        recipientType: 'builder'
      }
    });

    const builderSuspendedActivity = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'builder_suspended',
        recipientType: 'builder'
      }
    });
    expect(builderSuspendedActivity).toBe(1);
    expect(builderStrikeActivities).toBe(2);

    const scoutStrikeActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout.id,
        type: 'builder_strike',
        recipientType: 'scout'
      }
    });
    expect(scoutStrikeActivities).toBe(2);

    const scoutSuspendedActivity = await prisma.scoutGameActivity.count({
      where: {
        userId: scout.id,
        type: 'builder_suspended',
        recipientType: 'scout'
      }
    });
    expect(scoutSuspendedActivity).toBe(1);
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
      repo: { id: repoId, owner: username, name: 'testrepo' },
      url: `https://github.com/${username}/testrepo/pull/${randomLargeInt()}`
    });

    await mockRepo();

    const githubEvent = await prisma.githubEvent.findFirst({
      where: { pullRequestNumber: pullRequest.number }
    });
    expect(githubEvent).toBeNull();
  });

  it('should not create a new github event if it was processed before', async () => {
    const builder = await mockBuilder();
    const scout = await mockScout();
    const repo = await mockRepo();

    await mockBuilderNft({ builderId: builder.id, owners: [scout] });

    const pullRequest = mockPullRequest({
      createdAt: new Date().toISOString(),
      mergedAt: new Date().toISOString(),
      state: 'CLOSED',
      author: builder.githubUser,
      repo
    });

    (getClosedPullRequest as jest.Mock<typeof getClosedPullRequest>).mockResolvedValue({ login: v4() });

    await recordClosedPullRequest({ pullRequest, repo, season: mockSeason });
    await recordClosedPullRequest({ pullRequest, repo, season: mockSeason });
    await recordClosedPullRequest({ pullRequest, repo, season: mockSeason });

    const githubEventsCount = await prisma.githubEvent.count({
      where: {
        githubUser: {
          id: builder.githubUser.id
        }
      }
    });
    expect(githubEventsCount).toBe(1);

    const builderActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: builder.id,
        type: 'builder_strike',
        recipientType: 'builder'
      }
    });
    expect(builderActivities).toBe(1);

    const scoutActivities = await prisma.scoutGameActivity.count({
      where: {
        userId: scout.id,
        type: 'builder_strike',
        recipientType: 'scout'
      }
    });
    expect(scoutActivities).toBe(1);
  });
});
