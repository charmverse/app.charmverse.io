import type { GithubRepo } from '@charmverse/core/prisma';
import { graphql } from '@octokit/graphql';

export type PullRequest = {
  title: string;
  url: string;
  state: 'CLOSED' | 'MERGED';
  mergedAt: string | null;
  createdAt: string;
  author: {
    login: string;
  };
  number: number;
  repository: {
    id: string;
  };
};

type PullRequestEdge = {
  cursor: string;
  node: PullRequest;
};

type PageInfo = {
  endCursor: string;
  hasNextPage: boolean;
};

type PullRequestConnection = {
  edges: PullRequestEdge[];
  pageInfo: PageInfo;
};

type Repository = {
  pullRequests: PullRequestConnection;
};

type GetRecentClosedOrMergedPRsResponse = {
  repository: Repository;
};

const getRecentPrs = `
  query getRecentClosedOrMergedPRs($owner: String!, $repo: String!, $cursor: String) {
    repository(owner: $owner, name: $repo) {
      pullRequests(first: 100, after: $cursor, states: [CLOSED, MERGED], orderBy: {field: UPDATED_AT, direction: DESC}) {
        edges {
          node {
            title
            url
            state
            closedAt
            createdAt
            author {
              login
            }
            repository {
              id
            }
            number
          }
          cursor
        }
        pageInfo {
          endCursor
          hasNextPage
        }
      }
    }
  }
`;

type Input = {
  after: Date;
  owner: string;
  repo: string;
};

export async function getPullRequests({ repos, after }: { repos: Pick<GithubRepo, 'name' | 'owner'>[]; after: Date }) {
  const pullRequests: PullRequest[] = [];
  for (const repo of repos) {
    const repoPullRequests = await getRecentClosedOrMergedPRs({
      owner: repo.owner,
      repo: repo.name,
      after
    });
    pullRequests.push(...repoPullRequests);
  }
  return pullRequests;
}

export async function getRecentClosedOrMergedPRs({ owner, repo, after }: Input): Promise<PullRequest[]> {
  // Create an authenticated GraphQL client using your GitHub token
  const graphqlWithAuth = graphql.defaults({
    headers: {
      Authorization: `bearer ${process.env.GITHUB_ACCESS_TOKEN}`
    }
  });

  let hasNextPage = true;
  let cursor = null;
  let allRecentPRs: PullRequest[] = [];

  while (hasNextPage) {
    const response: GetRecentClosedOrMergedPRsResponse = await graphqlWithAuth({
      query: getRecentPrs,
      owner,
      repo,
      cursor
    });

    const pullRequests = response.repository.pullRequests.edges;

    // Filter out PRs closed or merged in the last 24 hours
    const recentPRs = pullRequests
      .filter(({ node }) => {
        const closedOrMergedAt = new Date(node.createdAt || '');
        return closedOrMergedAt > after;
      })
      .map(({ node }) => node);

    allRecentPRs = allRecentPRs.concat(recentPRs);

    // Update pagination info
    hasNextPage = response.repository.pullRequests.pageInfo.hasNextPage;
    cursor = response.repository.pullRequests.pageInfo.endCursor;

    if (recentPRs.length === 0) {
      hasNextPage = false;
    }
  }

  return allRecentPRs;
}

// getRecentClosedOrMergedPRs({
//   after: new Date('2024-09-16'),
//   owner: 'charmverse',
//   repo: 'app.charmverse.io'
// }).then((prs) => {
//   console.log(JSON.stringify(prs, null, 2));
// });
