// import { gql } from '@apollo/client';
import type { GithubRepo } from '@charmverse/core/prisma';

import { getClient } from './gqlClient';

export type PullRequest = {
  baseRefName: string; // eg "main"
  title: string;
  url: string;
  state: 'CLOSED' | 'MERGED';
  mergedAt: string | null;
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

const getRecentPrs = `
  query getRecentClosedOrMergedPRs($owner: String!, $repo: String!, $cursor: String) {
    repository(owner: $owner, name: $repo) {
      databaseId
      pullRequests(
        first: 100
        after: $cursor
        states: [CLOSED, MERGED]
        orderBy: { field: CREATED_AT, direction: DESC }
      ) {
        edges {
          node {
            baseRefName
            title
            url
            state
            closedAt
            createdAt
            author {
              login
              ... on User {
                id
              }
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

type Input = {
  after: Date;
  owner: string;
  repo: string;
};

type RepoInput = Pick<GithubRepo, 'name' | 'owner' | 'defaultBranch'>;

export async function getPullRequests({ repos, after }: { repos: RepoInput[]; after: Date }) {
  const pullRequests: PullRequest[] = [];
  for (const repo of repos) {
    const repoPullRequests = await getRecentClosedOrMergedPRs({
      owner: repo.owner,
      repo: repo.name,
      after
    });
    pullRequests.push(...repoPullRequests.filter((pr) => pr.baseRefName === repo.defaultBranch));
  }
  return pullRequests;
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

    const repositoryId = response.repository.databaseId;

    const pullRequests = response.repository.pullRequests.edges;

    // Filter out PRs closed or merged in the last 24 hours
    const recentPRs = pullRequests
      .filter(({ node }) => {
        const closedOrMergedAt = new Date(node.createdAt);
        // Some bots such as dependabot do not have an author id
        return closedOrMergedAt > after && !!node.author.id;
      })
      .map(({ node }) => {
        return {
          ...node,
          author: {
            id:
              typeof node.author.id === 'number'
                ? node.author.id
                : parseInt(atob(node.author.id as string).split(':User')[1]),
            login: node.author.login
          },
          repository: {
            id: repositoryId,
            nameWithOwner: node.repository.nameWithOwner
          }
        };
      });

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
