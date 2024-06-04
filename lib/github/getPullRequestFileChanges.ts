import type { PullRequestSummary } from '@charmverse/core/prisma-client';

import { GET } from 'adapters/http';
import { githubAccessToken } from 'config/constants';

import { GITHUB_API_BASE_URL } from './constants';

export type GithubFileChange = {
  sha: string;
  filename: string;
  status: string;
  additions: number;
  deletions: number;
  changes: number;
  blob_url: string;
  raw_url: string;
  contents_url: string;
  patch: string;
};

const ignoredFiles = ['package-lock.json'];

export type PullRequestToQuery = Pick<PullRequestSummary, 'number' | 'repoOwner' | 'repoName'>;

export async function getPullRequestFileChanges({
  number,
  repoName,
  repoOwner
}: PullRequestToQuery): Promise<GithubFileChange[]> {
  const requestUrl = `${GITHUB_API_BASE_URL}/repos/${repoOwner}/${repoName}/pulls/${number}/files`;

  const response = await GET<GithubFileChange[]>(requestUrl, undefined, {
    headers: {
      Authorization: `bearer ${githubAccessToken}`,
      Accept: 'application/vnd.github.v3+json'
    }
  });

  return response.filter((fileChange) => !ignoredFiles.some((filename) => fileChange.filename.endsWith(filename)));
}
