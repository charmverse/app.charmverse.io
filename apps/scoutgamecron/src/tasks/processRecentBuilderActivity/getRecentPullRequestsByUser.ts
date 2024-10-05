import { getClient } from './octokit';

type EdgeNode<T> = {
  cursor: string;
  node: T;
};

type PullRequestByUser = {
  baseRefName: string;
  title: string;
  number: number;
  url: string;
  closedAt?: string;
  createdAt: string;
  mergedAt?: string;
  state: 'CLOSED' | 'MERGED';
};

const getPrsByUser = `
  query ($filterQuery: String!) {
    search(query: $filterQuery, type: ISSUE, first: 10) {
      edges {
        node {
          ... on PullRequest {
            baseRefName
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

// get the latest pull requests by a user
export async function getRecentPullRequestsByUser({
  repoNameWithOwner,
  defaultBranch,
  username
}: {
  repoNameWithOwner: string;
  defaultBranch: string;
  username: string;
}): Promise<PullRequestByUser[]> {
  const graphqlWithAuth = getClient();
  const response = await graphqlWithAuth<{
    search: { edges: EdgeNode<PullRequestByUser>[] };
  }>({
    query: getPrsByUser,
    filterQuery: `repo:${repoNameWithOwner} is:pr author:${username}`
  });
  return response.search.edges.map((edge) => edge.node).filter((pr) => pr.baseRefName === defaultBranch);
}
