import { log } from '@charmverse/core/log';

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

  return { pullRequests, commits };
}

export type Commit = Awaited<ReturnType<typeof getCommits>>[number];

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
        author {
          id
        login
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

  const response = await octokit.paginate('GET /search/commits', {
    q: query,
    sort: 'committer-date',
    order: 'desc',
    per_page: 100
  });
  return response;
}

async function getPullRequests({ login, after }: { login: string; after: Date }): Promise<any[]> {
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

  return allItems;
}
