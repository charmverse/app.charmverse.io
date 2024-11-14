import { prisma } from '@charmverse/core/prisma-client';
import { jest } from '@jest/globals';
import type { Season } from '@packages/scoutgame/dates';
import { mockRepo, mockBuilder } from '@packages/scoutgame/testing/database';
import { mockSeason } from '@packages/scoutgame/testing/generators';
import { DateTime } from 'luxon';

import { mockCommit, mockPullRequest } from '@/testing/generators';

jest.unstable_mockModule('@packages/github/getCommitsByUser', () => ({
  getCommitsByUser: jest.fn()
}));

jest.unstable_mockModule('../github/getPullRequestsByUser', () => ({
  getPullRequestsByUser: jest.fn()
}));

// jest.unstable_mockModule('../recordMergedPullRequest', () => ({
//   recordMergedPullRequest: jest.fn()
// }));

// jest.unstable_mockModule('../recordCommit', () => ({
//   recordCommit: jest.fn()
// }));

jest.unstable_mockModule('../github/getRecentPullRequestsByUser', () => ({
  getRecentPullRequestsByUser: jest.fn()
}));
const { getRecentPullRequestsByUser } = await import('../github/getRecentMergedPullRequestsByUser');

const { getCommitsByUser } = await import('@packages/github/getCommitsByUser');
const { getPullRequestsByUser } = await import('../github/getPullRequestsByUser');
const { processBuilderActivity } = await import('../processBuilderActivity');
const { recordMergedPullRequest } = await import('../recordMergedPullRequest');
const { recordCommit } = await import('../recordCommit');

describe('processBuilderActivity', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should retrieve pull requests and commits for a repo we track', async () => {
    const repo = await mockRepo();
    const builder = await mockBuilder();

    const commit = mockCommit({
      author: builder.githubUser,
      repo
    });
    const pullRequest = mockPullRequest({
      mergedAt: new Date().toISOString(),
      createdAt: DateTime.local().minus({ days: 2 }).toISO(), // generate on a different day so that the commit gets counted
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getCommitsByUser as jest.Mock<typeof getCommitsByUser>).mockResolvedValue([commit]);
    (getPullRequestsByUser as jest.Mock<typeof getPullRequestsByUser>).mockResolvedValue([pullRequest]);
    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([]);

    await processBuilderActivity({
      builderId: builder.id,
      githubUser: builder.githubUser,
      createdAfter: new Date(),
      season: mockSeason as Season
    });

    const builderEvents = await prisma.builderEvent.count({
      where: {
        builderId: builder.id,
        season: mockSeason
      }
    });

    expect(builderEvents).toEqual(2);

    const builderStats = await prisma.userWeeklyStats.findFirst({
      where: {
        userId: builder.id
      }
    });
    expect(builderStats).toBeDefined();
    expect(builderStats!.season).toBe(mockSeason);
    expect(builderStats!.gemsCollected).toBe(101);
  });

  it('should not record a commit if a PR was recorded for the same sha', async () => {
    const repo = await mockRepo();
    const builder = await mockBuilder();

    const commit = mockCommit({
      author: builder.githubUser,
      repo
    });

    const pullRequest = mockPullRequest({
      sha: commit.sha,
      mergedAt: new Date().toISOString(),
      createdAt: DateTime.local().minus({ days: 2 }).toISO(), // generate on a different day so that the commit gets counted
      state: 'MERGED',
      author: builder.githubUser,
      repo
    });

    (getCommitsByUser as jest.Mock<typeof getCommitsByUser>).mockResolvedValue([commit]);
    (getPullRequestsByUser as jest.Mock<typeof getPullRequestsByUser>).mockResolvedValue([pullRequest]);
    (getRecentPullRequestsByUser as jest.Mock<typeof getRecentPullRequestsByUser>).mockResolvedValue([]);

    await processBuilderActivity({
      builderId: builder.id,
      githubUser: builder.githubUser,
      createdAfter: new Date(),
      season: mockSeason as Season
    });

    const builderEvents = await prisma.builderEvent.count({
      where: {
        builderId: builder.id,
        season: mockSeason
      }
    });

    expect(builderEvents).toEqual(1);

    const builderStats = await prisma.userWeeklyStats.findFirst({
      where: {
        userId: builder.id
      }
    });
    expect(builderStats).toBeDefined();
    expect(builderStats!.season).toBe(mockSeason);
    expect(builderStats!.gemsCollected).toBe(100);
  });
});
