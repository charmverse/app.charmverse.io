import { log } from '@charmverse/core/log';
import { prisma } from '@charmverse/core/prisma-client';
import type { Endpoints } from '@octokit/types';

import { decodeGithubUserId } from './getPullRequestsByRepo';
import { octokit } from './octokit';

export async function getBuilderActivity({ login, after }: { login: string; after: Date }) {
  const commits = await getCommits({
    login,
    after
  });

  const pullRequests = await getPullRequests({
    login,
    after
  });

  const prRepoIds = pullRequests.map((node) => node.repository.id);
  const commitRepoIds = commits.map((node) => node.repository.id);
  const reposToTrack = await prisma.githubRepo.findMany({
    where: {
      deletedAt: null,
      id: {
        in: [...prRepoIds, ...commitRepoIds]
      }
    }
  });
  return {
    // Filter out PRs we do not follow
    pullRequests: pullRequests.filter((node) => reposToTrack.some((r) => r.id === node.repository.id)),
    commits: commits.filter((node) => reposToTrack.some((r) => r.id === node.repository.id))
  };
}

export type Commit = Endpoints['GET /search/commits']['response']['data']['items'][number];

export type PullRequest = {
  author: {
    id: number;
    login: string;
  };
  baseRefName: string; // eg "main"
  title: string;
  url: string;
  state: 'CLOSED' | 'MERGED';
  mergedAt?: string;
  closedAt?: string;
  createdAt: string;
  number: number;
  mergeCommit?: {
    oid: string; // commit sha
  };
  repository: {
    databaseId: number;
    id: number;
    nameWithOwner: string;
    name: string;
    owner: { login: string };
    defaultBranchRef: {
      name: string;
    };
  };
};

type GraphQLSearchResponse = {
  search: {
    nodes: PullRequest[];
  };
};

const prSearchQuery = `
  query ($queryString: String!, $first: Int!, $cursor: String) {
    search(query: $queryString, type: ISSUE, first: $first, after: $cursor) {
      pageInfo {
        hasNextPage
        endCursor
      }
      nodes {
        ... on PullRequest {
        databaseId
          author {
            login
            ... on User {
              id
            }
          }
          baseRefName
          title
          url
          state
          mergedAt
          closedAt
          createdAt
          number
          mergeCommit {
            oid
          }
          repository {
            id
            databaseId
            nameWithOwner
            name
            owner {
              login
            }
            defaultBranchRef {
              name
            }
          }
        }
      }
    }
  }
`;

async function getCommits({ login, after }: { login: string; after: Date }) {
  const query = `author:${login} committer-date:>=${after.toISOString()}`;

  const response = await octokit.paginate<Commit>('GET /search/commits', {
    q: query,
    sort: 'committer-date',
    order: 'desc',
    per_page: 100
  });
  return response;
}

async function getPullRequests({ login, after }: { login: string; after: Date }) {
  const queryString = `is:pr author:${login} closed:>=${after.toISOString()}`;
  let allItems: PullRequest[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    try {
      // @ts-ignore
      const { search } = await octokit.graphql.paginate<GraphQLSearchResponse>(prSearchQuery, {
        queryString,
        first: 100,
        after: cursor
      });

      const items = search.nodes;
      allItems = allItems.concat(items);

      hasNextPage = search.pageInfo.hasNextPage;
      cursor = search.pageInfo.endCursor;
    } catch (error) {
      log.error(`Error fetching pull requests`, { error, login, after });
      break;
    }
  }

  return (
    allItems

      // Filter out PRs closed or merged in the last 24 hours

      .filter((node) => {
        // Some bots such as dependabot do not have an author id
        if (!node.author.id) {
          return false;
        }

        if (typeof node.author.id === 'string') {
          const decodedId = decodeGithubUserId(node.author.id, node.author.login);
          if (decodedId) {
            node.author.id = decodedId;
            return true;
          }
          return false;
        }
        return typeof node.author.id === 'number';
      })
      .map((node) => {
        return {
          ...node,
          author: node.author,
          repository: {
            ...node.repository,
            id: node.repository.databaseId
          }
        };
      })
  );
}
