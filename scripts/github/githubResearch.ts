import { prisma } from '@charmverse/core/prisma-client';
import { prettyPrint } from 'lib/utils/strings';
import { promises } from 'node:fs';
import { resolve } from 'path';

import { Octokit } from 'octokit';
import { GetResponseDataTypeFromEndpointMethod, Endpoints } from '@octokit/types';

const octokit = new Octokit();

type ListCommitsResponse = Endpoints['GET /repos/{owner}/{repo}/commits']['response']['data'];

// API Docs
// Commits - https://docs.github.com/en/rest/commits/commits?apiVersion=2022-11-28

function getHumanContributors(commits: ListCommitsResponse) {
  return Object.values(
    commits.reduce((acc: any, commit: any) => {
      const { author } = commit;
      if (author?.type === 'User') {
        if (!acc[author?.login]) {
          acc[author?.login] = {
            commits: 0,
            contributor: author
          };
        }
        acc[author?.login].commits++;
      }
      return acc;
    }, {})
  );
}

function getPullRequests({ repo, owner }: { owner: string; repo: string }) {
  return octokit.paginate('GET /repos/{owner}/{repo}/pulls', {
    owner,
    repo
  });
}

function getRepoCommits({ repo, owner }: { owner: string; repo: string }) {
  const octokit = new Octokit({ auth: '' });
  return octokit.paginate('GET /repos/{owner}/{repo}/commits', {
    owner,
    repo,
    per_page: 100
  });
}

function getGithubUser({ account_id }: { account_id: string }) {
  const octokit = new Octokit();
  return octokit.request('GET /users/{account_id}', {
    account_id
  });
}

type GithubRepo = {
  commits: number;
  contributors: GithubContributor[];
  raw: object;
};

type GithubCommit = {
  createdAt: Date;
  repo: string;
  contributorId: string;
  contributor: GithubContributor;
  raw: object;
};

type GithubContributor = {
  githubAccountId: number;
  username: string; // "login" in the schema
  fullName: string; // "name" in the schema
  company: string; // "company" in the schema
  commits: number;
  email: string | null;
  hireable: boolean | null;
  twitter: boolean | null; // "twitter_username" in the schema
  avatar: string; // "avatar_url" in the schema
  raw: object;
};

/* MAYBE INTERESTING
Per user:
  - Followers
  - Following


*/
