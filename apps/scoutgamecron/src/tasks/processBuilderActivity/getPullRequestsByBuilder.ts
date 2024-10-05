// import { gql } from '@apollo/client';
import { log } from '@charmverse/core/log';
import type { GithubRepo } from '@charmverse/core/prisma';

import { octokit } from './octokit';

export type PullRequest = {
  baseRefName: string; // eg "main"
  title: string;
  url: string;
  state: 'CLOSED' | 'MERGED';
  mergedAt?: string;
  closedAt?: string;
  createdAt: string;
  author: {
    login: string;
    id: number;
  };
  number: number;
  repository: {
    id: number;
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
    databaseId: number;
    pullRequests: {
      edges: EdgeNode<PullRequest>[];
      pageInfo: PageInfo;
    };
  };
};

const searchQuery = `
  query ($query: String!, $type: SearchType!, $first: Int!, $after: String) {
    search(query: $query, type: $type, first: $first, after: $after) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on PullRequest {
          baseRefName
          title
          url
          state
          mergedAt
          closedAt
          createdAt
          author {
            login
            ... on User {
              id
            }
          }
          number
          repository {
            id
            nameWithOwner
          }
        }
        ... on Commit {
          oid
          message
          committedDate
          author {
            user {
              login
              id
            }
          }
          repository {
            id
            nameWithOwner
          }
        }
      }
    }
  }
`;

export async function getPullRequestsByBuilder({ login, after }: { login: string; after: Date }) {
  const graphqlWithAuth = octokit.graphql.defaults({});

  const pullRequests = await getRecentItems({
    login,
    after,
    graphqlWithAuth,
    type: 'ISSUE',
    additionalFilters: 'is:pr is:merged'
  });

  const commits = await getRecentItems({
    login,
    after,
    graphqlWithAuth,
    type: 'COMMIT'
  });

  return { pullRequests, commits };
}

async function getRecentItems({
  login,
  after,
  graphqlWithAuth,
  type,
  additionalFilters = ''
}: {
  login: string;
  after: Date;
  graphqlWithAuth: any;
  type: 'ISSUE' | 'COMMIT';
  additionalFilters?: string;
}): Promise<any[]> {
  const query = `author:${login} created:>=${after.toISOString()} ${additionalFilters}`.trim();
  let allItems: any[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    try {
      const response: any = await graphqlWithAuth({
        query: searchQuery,
        variables: {
          query,
          type,
          first: 100,
          after: cursor
        }
      });

      const items = response.search.nodes;
      allItems = allItems.concat(items);

      hasNextPage = response.search.pageInfo.hasNextPage;
      cursor = response.search.pageInfo.endCursor;
    } catch (error) {
      log.error(`Error fetching ${type === 'ISSUE' ? 'pull requests' : 'commits'}`, { error, login, after });
      break;
    }
  }

  return allItems;
}
