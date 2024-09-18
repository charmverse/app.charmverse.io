import { gql } from '@apollo/client';
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
    nameWithOwner: string;
  };
};

type EdgeNode<T> = {
  cursor: string;
  node: T;
};

type PageInfo = {
  endCursor: string;
  hasNextPage: boolean;
};

type GetRecentClosedOrMergedPRsResponse = {
  repository: {
    pullRequests: {
      edges: EdgeNode<PullRequest>[];
      pageInfo: PageInfo;
    };
  };
};

const getRecentPrs = gql`
  query getRecentClosedOrMergedPRs($owner: String!, $repo: String!, $cursor: String) {
    repository(owner: $owner, name: $repo) {
      pullRequests(
        first: 100
        after: $cursor
        states: [CLOSED, MERGED]
        orderBy: { field: UPDATED_AT, direction: DESC }
      ) {
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
              nameWithOwner
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

type PullRequestByUser = {
  title: string;
  number: number;
  url: string;
  closedAt: string;
  createdAt: string;
  mergedAt: string;
  state: 'CLOSED' | 'MERGED';
};

const getPrsByUser = gql`
  query ($filterQuery: String!) {
    search(query: $filterQuery, type: ISSUE, first: 10) {
      edges {
        node {
          ... on PullRequest {
            title
            number
            url
            closedAt
            createdAt
            mergedAt
            state
          }
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

type RepoInput = Pick<GithubRepo, 'name' | 'owner'>;

export async function getPullRequests({ repos, after }: { repos: RepoInput[]; after: Date }) {
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

// Create an authenticated GraphQL client using your GitHub token
function getClient() {
  return graphql.defaults({
    headers: {
      Authorization: `bearer ${process.env.GITHUB_ACCESS_TOKEN}`
    }
  });
}

// get the latest pull requests by a user
export async function getRecentPullRequestsByUser({
  repoNameWithOwner,
  username
}: {
  repoNameWithOwner: string;
  username: string;
}): Promise<PullRequestByUser[]> {
  const graphqlWithAuth = getClient();
  const response = await graphqlWithAuth<{
    search: { edges: EdgeNode<PullRequestByUser>[] };
  }>({
    query: getPrsByUser,
    filterQuery: `repo:${repoNameWithOwner} is:pr author:${username}`
  });
  return response.search.edges.map((edge) => edge.node);
}

async function getRecentClosedOrMergedPRs({ owner, repo, after }: Input): Promise<PullRequest[]> {
  const graphqlWithAuth = getClient();

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
