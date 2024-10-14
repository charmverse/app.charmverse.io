import { log } from '@charmverse/core/log';

import { decodeGithubUserId } from './decodeGithubUserId';
import { octokit } from './octokit';

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

export async function getPullRequestsByUser({ login, after }: { login: string; after: Date }) {
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
