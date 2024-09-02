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

type Project = {
  // Ecosystem Level Information
  title: string;
  // These are the titles of other ecosystems in different .toml files in the /data/ecosystems directory
  sub_ecosystems: [];
  // This is a list of links to associated GitHub organizations.
  github_organizations: string[]; // ["https://github.com/zeroexchange"]
  // These are structs including a url and tags for a git repository. These URLs do not necessarily have to be on GitHub.
  repo: { url: string; missing?: boolean }[]; // { url:  "https://github.com/zeroexchange/0-charts" }
};

const fileName = resolve(process.cwd(), '../crypto-ecosystems-export/projects.json');

/**
 * Use this script to perform database searches.
 */

async function query() {
  // const commits = await getRepoCommits({ owner: 'charmverse', repo: 'app.charmverse.io' });
  // console.log('FIRST RESULT');

  // const contributors = getHumanContributors(commits);
  // console.log('contributors', contributors);

  const projects = await readProjects();
  console.log('Projects', projects.length);
  console.log('Repos', projects.map((p) => p.repo).flat().length);
}

query();

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

async function readProjects() {
  const file = await promises.readFile(fileName);
  const data: Project[] = JSON.parse(file.toString());
  return data;
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
