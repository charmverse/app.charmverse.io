import { graphql } from '@octokit/graphql';

type PullRequest = {
  title: string;
  url: string;
  state: 'OPEN' | 'CLOSED' | 'MERGED';
  mergedAt: string | null;
  closedAt: string | null;
  updatedAt: string;
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
            mergedAt
            closedAt
            updatedAt
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
        const closedOrMergedAt = new Date(node.closedAt || node.mergedAt || '');
        return closedOrMergedAt > after;
      })
      .map(({ node }) => node);

    allRecentPRs = allRecentPRs.concat(recentPRs);

    // cancel once we have gone past the after date
    if (recentPRs.length < pullRequests.length) {
      break;
    }

    // Update pagination info
    hasNextPage = response.repository.pullRequests.pageInfo.hasNextPage;
    cursor = response.repository.pullRequests.pageInfo.endCursor;
  }

  return allRecentPRs;
}
