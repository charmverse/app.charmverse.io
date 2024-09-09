import { log } from '@charmverse/core/log';
import { githubAccessToken } from '@root/config/constants';
import { githubGrapghQLClient } from 'lib/github/githubGraphQLClient';
import { uniq, uniqBy } from 'lodash';
import { Octokit } from '@octokit/core';
import { paginateGraphQL } from '@octokit/plugin-paginate-graphql';

const MyOctokit = Octokit.plugin(paginateGraphQL);
const octokit = new MyOctokit({ auth: githubAccessToken });

type RepositoryData = {
  id: string;
  url: string;
  assignableUsers: {
    totalCount: number;
  };
  stargazerCount: number;
  pullRequests: {
    edges: {
      node: {
        id: string;
        number: number;
        createdAt: string;
        updatedAt: string;
        title: string;
        author: {
          login: string;
          avatarUrl?: string;
        };
      };
    }[];
  };
  forkCount: number;
  watchers: {
    totalCount: number;
  };
  // releases: {
  //   totalCount: number;
  // };
};

type FlatRepositoryData = {
  id: string;
  url: string;
  assignableUserCount: number;
  stargazerCount: number;
  pullRequestCount: number;
  pullRequests: RepositoryData['pullRequests']['edges'];
  recentPullRequestAuthors: number;
  watcherCount: number;
  // releaseCount: number;
  forkCount: number;
  authors: { login: string; avatarUrl?: string }[];
};

// get pull requests by repo: "<owner>/<repo>"
const queryPullRequests = (repo: string) =>
  octokit.graphql.paginate<{
    search: { edges: { node: RepositoryData['pullRequests']['edges'][number]['node'] }[] };
  }>(
    `query ($repo: String!, $cursor: String) {
      search(query: $repo, type: ISSUE, first: 100, after: $cursor) {
        edges {
          node {
            ... on PullRequest {
              id
              number
              createdAt
              updatedAt
              title
              author {
                login
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }`,
    {
      repo: repo + ' is:pr is:merged updated:2024-06-01..2024-09-01'
    }
  );

const queryRepos = (repos: string[]) =>
  octokit.graphql<{ search: { edges: { node: RepositoryData }[] } }>(
    `
  query ($repos: String!) {
    search(query: $repos, type: REPOSITORY, first: 10) {
      edges {
        node {
          ... on Repository {
            id
            url
            assignableUsers {
              totalCount
            }
            stargazerCount
            pullRequests(first: 50, states: MERGED, orderBy: { field: UPDATED_AT, direction: DESC }) {
              edges {
                node {
                  id
                  number
                  createdAt
                  updatedAt
                  title
                  author {
                    login
                  }
                }
              }
              pageInfo {
                hasNextPage
              }
            }
            forkCount
            watchers {
              totalCount
            }
          }
        }
      }
    }
  }
`,
    {
      repos: repos.join(' ')
    }
  );

function mapToFlatObject(data: RepositoryData, cutoffDate: Date): FlatRepositoryData {
  const filteredPullRequests = data.pullRequests.edges.filter((edge) => {
    const updatedAt = new Date(edge.node.updatedAt);

    return updatedAt >= cutoffDate;
  });

  const uniqAuthors = uniqBy(filteredPullRequests.map((pr) => pr.node.author).filter(Boolean), 'login');
  const missingAuthor = filteredPullRequests.find((edge) => !edge.node.author);
  if (missingAuthor) {
    console.log('Missing author', data.url, missingAuthor);
  }

  return {
    id: data.id,
    url: data.url,
    assignableUserCount: data.assignableUsers.totalCount,
    stargazerCount: data.stargazerCount,
    pullRequests: filteredPullRequests,
    pullRequestCount: filteredPullRequests.length,
    recentPullRequestAuthors: uniqAuthors.length, // Ensures unique authors
    watcherCount: data.watchers.totalCount,
    // releaseCount: data.releases.totalCount,
    forkCount: data.forkCount,
    authors: uniqAuthors
  };
}

export async function getRepositoryActivity({ cutoffDate, repos }: { cutoffDate: Date; repos: string[] }) {
  const totalRepos = repos.length;

  const perQuery = 50;

  const maxQueriedRepos = totalRepos;

  log.info(`Total repos to query: ${totalRepos}`);

  const allData: FlatRepositoryData[] = [];

  for (let i = 0; i <= maxQueriedRepos; i += perQuery) {
    const repoList = repos.slice(i, i + perQuery).map((repo) => `repo:${repo.replace('https://github.com/', '')}`);

    if (repoList.length === 0) {
      break;
    }

    const results = await queryRepos(repoList).then(async (data) => {
      const repos = data.search.edges.map((edge) => edge.node);
      const _results: FlatRepositoryData[] = [];
      for (let repo of repos) {
        if (repo.pullRequests.edges.length >= 50) {
          const extra = await queryPullRequests(repo.url.replace('https://github.com/', ''));
          repo.pullRequests.edges = extra.search.edges;
          _results.push(mapToFlatObject(repo, cutoffDate));
          console.log('paginated PRs', repo.pullRequests.edges.length);
        }
      }
      return _results;
    });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    allData.push(...results);

    log.info(`Queried repos ${i + 1}-${i + Math.min(repoList.length, perQuery)} / ${maxQueriedRepos}`);
  }
  return allData;
}
