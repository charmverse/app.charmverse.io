import { gql } from '@apollo/client';

import { githubGrapghQLClient } from './githubGraphQLClient';

export function pullRequestSelect() {
  return `
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
  `;
}

export type PullRequestMeta = {
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

export async function getPullRequestMeta({
  owner,
  number,
  repo
}: {
  owner: string;
  repo: string;
  number: number | string;
}): Promise<PullRequestMeta> {
  const query = gql`
  query GetPullRequest($owner: String!, $repo: String!, $number: Int!) {
    repository(owner: $owner, name: $repo) {
      pullRequest(number: $number) {
        ${pullRequestSelect()}
      }
    }
  }
`;

  const pullRequestInfo = await githubGrapghQLClient.query({
    query,
    variables: { owner, repo, number }
  });

  return pullRequestInfo.data.repository.pullRequest as PullRequestMeta;
}
