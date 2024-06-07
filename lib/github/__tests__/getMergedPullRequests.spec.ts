import { POST } from 'adapters/http';

import { getMergedPullRequests } from '../getMergedPullRequests';
import type { PullRequestMeta } from '../getPullRequestMeta';

jest.mock('adapters/http');

const mockedPOST = POST as jest.MockedFunction<typeof POST>;

const exampleData: PullRequestMeta[] = [
  {
    number: 4099,
    title: 'Fix type for deploy',
    url: 'https://github.com/charmverse/app.charmverse.io/pull/4099',
    additions: 12,
    deletions: 2,
    author: { login: 'dev29' },
    createdAt: '2024-05-27T12:07:18Z',
    mergedAt: '2024-05-27T12:23:08Z',
    repository: { nameWithOwner: 'charmverse/app.charmverse.io' }
  },
  {
    number: 4004,
    title: 'Docusign integration',
    url: 'https://github.com/charmverse/app.charmverse.io/pull/4004',
    additions: 2378,
    deletions: 33,
    author: { login: 'dev29' },
    createdAt: '2024-04-30T14:39:00Z',
    mergedAt: '2024-05-24T12:16:46Z',
    repository: { nameWithOwner: 'charmverse/app.charmverse.io' }
  },
  {
    number: 285,
    title: 'Docusign',
    url: 'https://github.com/charmverse/core/pull/285',
    additions: 136,
    deletions: 1,
    author: { login: 'dev29' },
    createdAt: '2024-04-28T10:09:16Z',
    mergedAt: '2024-05-24T12:11:44Z',
    repository: { nameWithOwner: 'charmverse/core' }
  },
  {
    number: 4066,
    title: 'redeploy',
    url: 'https://github.com/charmverse/app.charmverse.io/pull/4066',
    additions: 0,
    deletions: 0,
    author: { login: 'dev29' },
    createdAt: '2024-05-17T16:05:34Z',
    mergedAt: '2024-05-17T16:16:45Z',
    repository: { nameWithOwner: 'charmverse/app.charmverse.io' }
  }
];

describe('getMergedPullRequests', () => {
  beforeEach(() => {
    mockedPOST.mockClear();
  });

  it('should fetch merged pull requests for a given username', async () => {
    mockedPOST.mockResolvedValue({
      data: {
        user: {
          pullRequests: {
            nodes: exampleData,
            pageInfo: {
              hasNextPage: false,
              endCursor: 'endCursor'
            }
          }
        }
      }
    });

    const pullRequests = await getMergedPullRequests({ githubUsername: 'dev29' });
    expect(pullRequests).toEqual(exampleData);
    expect(mockedPOST).toHaveBeenCalledTimes(1);
  });

  it('should respect the limit parameter', async () => {
    mockedPOST.mockResolvedValue({
      data: {
        user: {
          pullRequests: {
            nodes: exampleData,
            pageInfo: {
              hasNextPage: false,
              endCursor: 'endCursor'
            }
          }
        }
      }
    });

    const pullRequests = await getMergedPullRequests({ githubUsername: 'dev29', limit: 2 });
    expect(pullRequests.length).toBe(2);
    expect(mockedPOST).toHaveBeenCalledTimes(1);
  });

  it('should respect the fromDate parameter', async () => {
    const filteredData = exampleData.filter((pr) => new Date(pr.mergedAt) >= new Date('2024-05-20'));
    mockedPOST.mockResolvedValue({
      data: {
        user: {
          pullRequests: {
            nodes: exampleData,
            pageInfo: {
              hasNextPage: false,
              endCursor: 'endCursor'
            }
          }
        }
      }
    });

    const pullRequests = await getMergedPullRequests({ githubUsername: 'dev29', fromDate: '2024-05-20' });
    expect(pullRequests).toEqual(filteredData);
    expect(mockedPOST).toHaveBeenCalledTimes(1);
  });

  it('should handle pagination correctly', async () => {
    const paginatedData = [exampleData[0]];
    mockedPOST
      .mockResolvedValueOnce({
        data: {
          user: {
            pullRequests: {
              nodes: paginatedData,
              pageInfo: {
                hasNextPage: true,
                endCursor: 'endCursor1'
              }
            }
          }
        }
      })
      .mockResolvedValueOnce({
        data: {
          user: {
            pullRequests: {
              nodes: exampleData.slice(1),
              pageInfo: {
                hasNextPage: false,
                endCursor: 'endCursor2'
              }
            }
          }
        }
      });

    const pullRequests = await getMergedPullRequests({ githubUsername: 'dev29', limit: 4 });
    expect(pullRequests).toEqual(exampleData);
    expect(mockedPOST).toHaveBeenCalledTimes(2);
  });

  it('should filter out pull requests with specific titles', async () => {
    const dataWithFilteredTitles = [
      ...exampleData,
      {
        id: 'PR_filtered',
        number: 9999,
        title: 'Revert "Some change"',
        url: 'https://github.com/charmverse/app.charmverse.io/pull/9999',
        additions: 0,
        deletions: 0,
        createdAt: '2024-06-01T12:00:00Z',
        mergedAt: '2024-06-01T12:30:00Z',
        repository: { nameWithOwner: 'charmverse/app.charmverse.io' }
      }
    ];
    const filteredData = dataWithFilteredTitles.filter((pr) => !pr.title.toLowerCase().includes('revert'));

    mockedPOST.mockResolvedValue({
      data: {
        user: {
          pullRequests: {
            nodes: dataWithFilteredTitles,
            pageInfo: {
              hasNextPage: false,
              endCursor: 'endCursor'
            }
          }
        }
      }
    });

    const pullRequests = await getMergedPullRequests({ githubUsername: 'dev29' });
    expect(pullRequests).toEqual(filteredData);
    expect(mockedPOST).toHaveBeenCalledTimes(1);
  });
});
