import { gql } from '@apollo/client';

import { pullRequestSelect, type PullRequestMeta } from './getPullRequestMeta';
import { githubGrapghQLClient } from './githubGraphQLClient';

export type GithubUserName = { githubUsername: string };

export type GithubGraphQLQuery = {
  limit?: number;
  fromDate?: Date | string;
};

const filteredRequestTitles = ['revert'];

export async function getMergedPullRequests({
  githubUsername,
  limit = 100,
  fromDate
}: GithubUserName & GithubGraphQLQuery): Promise<PullRequestMeta[]> {
  const query = gql`
    query GetMergedPullRequests($login: String!, $after: String, $limit: Int!) {
      user(login: $login) {
        pullRequests(first: $limit, states: MERGED, orderBy: { field: UPDATED_AT, direction: DESC }, after: $after) {
          nodes {
            ${pullRequestSelect()}
          }
          pageInfo {
            endCursor
            hasNextPage
          }
        }
      }
    }
  `;

  let hasNextPage = true;
  let afterCursor = null;
  let allPullRequestsInRange: PullRequestMeta[] = [];

  // The variables to pass to the query
  const variables = {
    login: githubUsername,
    after: afterCursor || null,
    limit: Math.min(limit - allPullRequestsInRange.length, 100)
  };

  const fromDateObj = fromDate ? new Date(fromDate) : null;

  while (hasNextPage && allPullRequestsInRange.length < limit) {
    const { data } = await githubGrapghQLClient.query<{
      user: {
        pullRequests: {
          nodes: PullRequestMeta[];
          pageInfo: {
            hasNextPage: boolean;
            endCursor: string;
          };
        };
      };
    }>({
      query,
      variables
    });

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
