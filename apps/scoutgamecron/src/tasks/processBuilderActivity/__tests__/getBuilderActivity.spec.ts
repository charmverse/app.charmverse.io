import { jest } from '@jest/globals';
import { mockRepo, mockGithubUser } from '@packages/scoutgame/testing/database';

import { mockCommit, mockPullRequest } from '@/testing/generators';

jest.unstable_mockModule('@packages/github/getCommitsByUser', () => ({
  getCommitsByUser: jest.fn()
}));

jest.unstable_mockModule('../github/getPullRequestsByUser', () => ({
  getPullRequestsByUser: jest.fn()
}));

const { getCommitsByUser } = await import('@packages/github/getCommitsByUser');
const { getPullRequestsByUser } = await import('../github/getPullRequestsByUser');
const { getBuilderActivity } = await import('../getBuilderActivity');

describe('getBuilderActivity', () => {
  beforeEach(() => {
    jest.resetAllMocks();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  it('should retrieve pull requests and commits for a repo we track', async () => {
    const repo = await mockRepo();
    const githubUser = await mockGithubUser();

    const commit = mockCommit({
      author: githubUser,
      repo
    });
    const pullRequest = mockPullRequest({
      mergedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      state: 'MERGED',
      author: githubUser,
      repo
    });

    (getCommitsByUser as jest.Mock<typeof getCommitsByUser>).mockResolvedValue([commit]);
    (getPullRequestsByUser as jest.Mock<typeof getPullRequestsByUser>).mockResolvedValue([pullRequest]);

    const { commits, pullRequests } = await getBuilderActivity({
      login: githubUser.login,
      after: new Date()
    });
    expect(commits.map((data) => data.sha)).toEqual([commit.sha]);
    expect(pullRequests.map((pr) => pr.repository.id)).toEqual([pullRequest.repository.id]);
  });

  it('should not retrieve pull requests or commits for a repo we do not track', async () => {
    const githubUser = await mockGithubUser();

    const commit = mockCommit({
      author: githubUser
    });
    const pullRequest = mockPullRequest({
      mergedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      state: 'MERGED',
      author: githubUser
    });

    (getCommitsByUser as jest.Mock<typeof getCommitsByUser>).mockResolvedValue([commit]);
    (getPullRequestsByUser as jest.Mock<typeof getPullRequestsByUser>).mockResolvedValue([pullRequest]);

    const { commits, pullRequests } = await getBuilderActivity({
      login: githubUser.login,
      after: new Date()
    });
    expect(commits).toHaveLength(0);
    expect(pullRequests).toHaveLength(0);
  });
});
