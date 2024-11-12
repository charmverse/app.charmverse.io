import { log } from '@charmverse/core/log';

import { octokit } from './octokit';

type GraphQLPullRequest = {
  author: {
    id: number | string;
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

// we convert the author id to a number consistently to simplify consuming code
export type PullRequest = Omit<GraphQLPullRequest, 'author'> & {
  author: {
    id: number;
    login: string;
  };
};

type GraphQLSearchResponse = {
  search: {
    nodes: GraphQLPullRequest[];
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

export async function getPullRequestsByUser({
  login,
  githubUserId,
  after
}: {
  login: string;
  githubUserId?: number;
  after: Date;
}): Promise<PullRequest[]> {
  const queryString = `is:pr author:${login} closed:>=${after.toISOString()}`;
  let allItems: GraphQLPullRequest[] = [];
  let hasNextPage = true;
  let cursor: string | null = null;

  while (hasNextPage) {
    try {
      // @ts-expect-error tbd what error is
      const { search } = await octokit.graphql.paginate<GraphQLSearchResponse>(prSearchQuery, {
        queryString,
        first: 100,
        after: cursor
      });

      const items = search.nodes as GraphQLPullRequest[];
      allItems = allItems.concat(items);

      hasNextPage = search.pageInfo.hasNextPage;
      cursor = search.pageInfo.endCursor;
    } catch (error) {
      log.error(`Error fetching pull requests`, { error, login, after });
      break;
    }
  }

  return allItems
    .map((node) => {
      return {
        ...node,
        author: {
          id: githubUserId || (node.author.id as number),
          login: node.author.login
        },
        repository: {
          ...node.repository,
          id: node.repository.databaseId
        }
      };
    })
    .filter((pr) => typeof pr.author.id === 'number');
}
