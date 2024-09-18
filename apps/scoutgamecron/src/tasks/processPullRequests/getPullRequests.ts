import type { GithubRepo } from '@charmverse/core/prisma';
import { graphql } from '@octokit/graphql';

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
        orderBy: { field: UPDATED_AT, direction: DESC }
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
  baseRefName: string;
  title: string;
  number: number;
  url: string;
  closedAt: string;
  createdAt: string;
  mergedAt: string;
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

type GetPrCloserResponse = {
  repository: {
    pullRequest: {
      title: string;
      state: 'CLOSED' | 'MERGED';
      timelineItems: {
        edges: {
          node: {
            actor: {
              login: string;
            };
            createdAt: string;
          };
        }[];
      };
    };
  };
};

const getPrCloser = `
  query ($owner: String!, $repo: String!, $prNumber: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $prNumber) {
        title
        state
        timelineItems(first: 10, itemTypes: [CLOSED_EVENT]) {
          edges {
            node {
              ... on ClosedEvent {
                actor {
                  login
                }
                createdAt
              }
            }
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
  return response.search.edges.map((edge) => edge.node);
}

export async function getClosedPullRequest({
  pullRequestNumber,
  repo
}: {
  pullRequestNumber: number;
  repo: { name: string; owner: string };
}) {
  const graphqlWithAuth = getClient();
  const response = await graphqlWithAuth<GetPrCloserResponse>({
    query: getPrCloser,
    repo: repo.name,
    owner: repo.owner,
    prNumber: pullRequestNumber
  });
  const actor = response.repository.pullRequest.timelineItems.edges.map((edge) => edge.node)[0]?.actor;
  return { login: actor?.login };
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
        return closedOrMergedAt > after;
      })
      .map(({ node }) => ({
        ...node,
        author: {
          id: parseInt(btoa(node.author.id.toString()).split(':')[1]),
          login: node.author.login
        },
        repository: {
          id: repositoryId,
          nameWithOwner: node.repository.nameWithOwner
        }
      }));

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

// getRecentClosedOrMergedPRs({
//   after: new Date('2024-09-16'),
//   owner: 'charmverse',
//   repo: 'app.charmverse.io'
// }).then(console.log);
