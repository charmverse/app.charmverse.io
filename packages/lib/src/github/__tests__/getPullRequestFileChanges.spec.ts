import { prisma } from '@charmverse/core/prisma-client';
import { githubAccessToken } from '@packages/config/constants';
import { randomIntFromInterval } from '@packages/utils/random';
import { GET } from '@packages/adapters/http';

import { GITHUB_API_BASE_URL } from '../constants';
import type { GithubFileChange, PullRequestToQuery } from '../getPullRequestFileChanges';
import { getPullRequestFileChanges } from '../getPullRequestFileChanges';

jest.mock('@packages/adapters/http');

const mockedGET = GET as jest.MockedFunction<typeof GET>;

const exampleFileChanges: GithubFileChange[] = [
  {
    sha: '1',
    filename: 'src/index.js',
    status: 'modified',
    additions: 10,
    deletions: 2,
    changes: 12,
    blob_url: 'https://github.com/repo/blob/1',
    raw_url: 'https://github.com/repo/raw/1',
    contents_url: 'https://github.com/repo/contents/1',
    patch: 'patch1'
  },
  // This file should be ignored
  {
    sha: '2',
    filename: 'src/package-lock.json',
    status: 'modified',
    additions: 200,
    deletions: 100,
    changes: 300,
    blob_url: 'https://github.com/repo/blob/2',
    raw_url: 'https://github.com/repo/raw/2',
    contents_url: 'https://github.com/repo/contents/2',
    patch: 'patch2'
  },
  {
    sha: '3',
    filename: 'src/utils.js',
    status: 'added',
    additions: 20,
    deletions: 0,
    changes: 20,
    blob_url: 'https://github.com/repo/blob/3',
    raw_url: 'https://github.com/repo/raw/3',
    contents_url: 'https://github.com/repo/contents/3',
    patch: 'patch3'
  }
];

const exampleOwner = `owner-${randomIntFromInterval(1, 1000)}`;
const exampleRepo = `repo-${randomIntFromInterval(1, 1000)}`;

describe('getPullRequestFileChanges', () => {
  beforeAll(async () => {
    await prisma.pullRequestSummary.deleteMany({
      where: {
        repoOwner: exampleOwner,
        repoName: exampleRepo
      }
    });
  });

  beforeEach(() => {
    mockedGET.mockClear();
  });

  it('should fetch and filter out ignored files', async () => {
    mockedGET.mockResolvedValueOnce(exampleFileChanges);

    const params: PullRequestToQuery = {
      prNumber: 123,
      repoName: exampleRepo,
      repoOwner: exampleOwner
    };

    const result = await getPullRequestFileChanges(params);

    const expected: GithubFileChange[] = [exampleFileChanges[0], exampleFileChanges[2]];

    expect(result).toEqual(expected);
    expect(result).not.toContain(exampleFileChanges[1]);
    expect(mockedGET).toHaveBeenCalledWith(
      `${GITHUB_API_BASE_URL}/repos/${exampleOwner}/${exampleRepo}/pulls/123/files`,
      undefined,
      {
        headers: {
          Authorization: `bearer ${githubAccessToken}`,
          Accept: 'application/vnd.github.v3+json'
        }
      }
    );
  });
});
