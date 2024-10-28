import { octokit } from './octokit';

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
  repository: {
    owner: {
      login: string;
    };
  };
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
            state,
            repository {
              owner {
                login
              }
            }
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
  const graphqlWithAuth = octokit.graphql.defaults({});
  const response = await graphqlWithAuth<{
    search: { edges: EdgeNode<PullRequestByUser>[] };
  }>({
    query: getPrsByUser,
    filterQuery: `repo:${repoNameWithOwner} is:pr author:${username}`
  });
  return response.search.edges.map((edge) => edge.node).filter((pr) => pr.baseRefName === defaultBranch);
}
