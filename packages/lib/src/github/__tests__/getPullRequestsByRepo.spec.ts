import { githubGrapghQLClient } from '@packages/lib/github/githubGraphQLClient';

import type { PullRequestMeta } from '../getPullRequestMeta';
import type { PullRequestsByRepo } from '../getPullRequestsByRepo';
import { getPullRequestsByRepo } from '../getPullRequestsByRepo';

jest.mock('lib/github/githubGraphQLClient');

const mockedGraphQlClient = githubGrapghQLClient as jest.Mocked<typeof githubGrapghQLClient>;

const exampleData: PullRequestMeta[] = [
  {
    number: 4099,
    title: 'Fix type for deploy',
    url: 'https://github.com/charmverse/app.charmverse.io/pull/4099',
    additions: 12,
    deletions: 2,
    author: { login: 'dev30' },
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
    author: { login: 'dev30' },
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
    author: { login: 'dev30' },
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
    author: { login: 'dev30' },
    createdAt: '2024-05-17T16:05:34Z',
    mergedAt: '2024-05-17T16:16:45Z',
    repository: { nameWithOwner: 'charmverse/app.charmverse.io' }
  }
];

describe('getPullRequestsByRepo', () => {
  beforeEach(() => {
    mockedGraphQlClient.query.mockClear();
  });

  it('should fetch, group, and sort pull requests by repository', async () => {
    mockedGraphQlClient.query.mockResolvedValueOnce({
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
    } as any);

    const params = { githubUsername: 'charmverse' };
    const result = await getPullRequestsByRepo(params);

    const expected: PullRequestsByRepo[] = [
      {
        repoName: 'app.charmverse.io',
        repoOwner: 'charmverse',
        pullRequests: [exampleData[0], exampleData[1], exampleData[3]]
      },
      {
        repoName: 'core',
        repoOwner: 'charmverse',
        pullRequests: [exampleData[2]]
      }
    ];

    expect(result).toEqual(expected);
    expect(result[0].pullRequests.length).toBeGreaterThanOrEqual(result[1].pullRequests.length);
    expect(mockedGraphQlClient.query).toHaveBeenCalledTimes(1);
  });

  it('should handle empty response', async () => {
    mockedGraphQlClient.query.mockResolvedValueOnce({
      data: {
        user: {
          pullRequests: {
            nodes: [],
            pageInfo: {
              hasNextPage: false,
              endCursor: null
            }
          }
        }
      }
    } as any);

    const params = { githubUsername: 'charmverse' };
    const result = await getPullRequestsByRepo(params);

    expect(result).toEqual([]);
    expect(mockedGraphQlClient.query).toHaveBeenCalledTimes(1);
  });

  it('should handle multiple pages of results', async () => {
    const paginatedData1 = [exampleData[0]];
    const paginatedData2 = [exampleData[1], exampleData[2], exampleData[3]];

    mockedGraphQlClient.query
      .mockResolvedValueOnce({
        data: {
          user: {
            pullRequests: {
              nodes: paginatedData1,
              pageInfo: {
                hasNextPage: true,
                endCursor: 'endCursor1'
              }
            }
          }
        }
      } as any)
      .mockResolvedValueOnce({
        data: {
          user: {
            pullRequests: {
              nodes: paginatedData2,
              pageInfo: {
                hasNextPage: false,
                endCursor: 'endCursor2'
              }
            }
          }
        }
      } as any);

    const params = { githubUsername: 'charmverse', limit: 4 };
    const result = await getPullRequestsByRepo(params);

    const expected: PullRequestsByRepo[] = [
      {
        repoName: 'app.charmverse.io',
        repoOwner: 'charmverse',
        pullRequests: [exampleData[0], exampleData[1], exampleData[3]]
      },
      {
        repoName: 'core',
        repoOwner: 'charmverse',
        pullRequests: [exampleData[2]]
      }
    ];

    expect(result).toEqual(expected);
    expect(result[0].pullRequests.length).toBeGreaterThanOrEqual(result[1].pullRequests.length);
    expect(mockedGraphQlClient.query).toHaveBeenCalledTimes(2);
  });
});
