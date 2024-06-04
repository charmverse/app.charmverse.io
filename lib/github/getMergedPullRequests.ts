import { POST } from 'adapters/http';
import { githubAccessToken } from 'config/constants';

import { GITHUB_GRAPHQL_BASE_URL } from './constants';

export type GithubUserName = { githubUsername: string };

export type GithubGraphQLQuery = {
  limit?: number;
  fromDate?: Date | string;
};

export type PullRequestMeta = {
  id: string;
  number: number;
  title: string;
  url: string;
  author: {
    login: string;
  };
  additions: number;
  deletions: number;
  createdAt: string;
  mergedAt: string;
  repository: {
    nameWithOwner: string;
  };
};

const filteredRequestTitles = ['revert'];

export async function getMergedPullRequests({
  githubUsername,
  limit = 100,
  fromDate
}: GithubUserName & GithubGraphQLQuery): Promise<PullRequestMeta[]> {
  let hasNextPage = true;
  let afterCursor = null;
  let allPullRequestsInRange: PullRequestMeta[] = [];
  const fromDateObj = fromDate ? new Date(fromDate) : null;

  while (hasNextPage && allPullRequestsInRange.length < limit) {
    const query: string = `{
      user(login: "${githubUsername}") {
        pullRequests(first: ${Math.min(
          // If we are near the end, don't fetch more than the limit
          limit - allPullRequestsInRange.length,
          100
        )}, states: MERGED, orderBy: {field: UPDATED_AT, direction: DESC}${
      afterCursor ? `, after: "${afterCursor}"` : ''
    }) {
          nodes {
            id
            number
            title
            url
            additions
            deletions
            createdAt
            mergedAt
            author {
              login
            }
            repository {
              nameWithOwner
            }
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }`;

    const { data } = await POST<{
      data: {
        user: {
          pullRequests: {
            nodes: PullRequestMeta[];
            pageInfo: {
              hasNextPage: boolean;
              endCursor: string;
            };
          };
        };
      };
    }>(
      GITHUB_GRAPHQL_BASE_URL,
      { query },
      {
        headers: {
          Authorization: `bearer ${githubAccessToken}`
        }
      }
    );

    const { nodes, pageInfo } = data.user.pullRequests;

    const filteredNodes = nodes.filter(
      (pr) =>
        (!fromDateObj || new Date(pr.mergedAt) >= fromDateObj) &&
        !filteredRequestTitles.some((title) => pr.title.toLowerCase().match(title.toLowerCase()))
    );

    allPullRequestsInRange = allPullRequestsInRange.concat(filteredNodes);

    // Check if fromDate results in fewer pull requests than the limit
    if (fromDateObj && filteredNodes.length < nodes.length) {
      hasNextPage = false; // Stop fetching more as all subsequent results will be before fromDate
    } else if (allPullRequestsInRange.length >= limit) {
      return allPullRequestsInRange.slice(0, limit);
    } else {
      hasNextPage = pageInfo.hasNextPage;
      afterCursor = pageInfo.endCursor;
    }
  }

  return allPullRequestsInRange;
}

// getMergedPullRequests({ githubUsername: 'motechFR', limit: 5, fromDate: '2023-05-10' }).then(console.log);
