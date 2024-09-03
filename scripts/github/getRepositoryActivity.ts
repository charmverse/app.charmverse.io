import { gql } from '@apollo/client';
import { log } from '@charmverse/core/log';

import { githubGrapghQLClient } from 'lib/github/githubGraphQLClient';
import { uniq, uniqBy } from 'lodash';

type RepositoryData = {
  id: string;
  url: string;
  assignableUsers: {
    totalCount: number;
  };
  stargazerCount: number;
  pullRequests: {
    edges: {
      node: {
        id: string;
        number: number;
        createdAt: string;
        updatedAt: string;
        title: string;
        author: {
          login: string;
          avatarUrl?: string;
        };
      };
    }[];
  };
  forkCount: number;
  watchers: {
    totalCount: number;
  };
  // releases: {
  //   totalCount: number;
  // };
};

type FlatRepositoryData = {
  id: string;
  url: string;
  assignableUserCount: number;
  stargazerCount: number;
  pullRequestCount: number;
  pullRequests: RepositoryData['pullRequests']['edges'];
  recentPullRequestAuthors: number;
  watcherCount: number;
  // releaseCount: number;
  forkCount: number;
  authors: { login: string; avatarUrl?: string }[];
};

const repoMetdataQuery = gql`
  query ($repos: String!) {
    search(query: $repos, type: REPOSITORY, first: 10) {
      edges {
        node {
          ... on Repository {
            id
            url
            assignableUsers {
              totalCount
            }
            stargazerCount
            pullRequests(first: 100, states: MERGED, orderBy: { field: UPDATED_AT, direction: DESC }) {
              edges {
                node {
                  number
                  createdAt
                  updatedAt
                  title
                  author {
                    login
                  }
                }
              }
            }
            forkCount
            watchers {
              totalCount
            }
          }
        }
      }
    }
  }
`;

function mapToFlatObject(data: RepositoryData, cutoffDate: Date): FlatRepositoryData {
  const filteredPullRequests = data.pullRequests.edges.filter((edge) => {
    const updatedAt = new Date(edge.node.updatedAt);

    return updatedAt >= cutoffDate;
  });

  const uniqAuthors = uniqBy(filteredPullRequests.map((pr) => pr.node.author).filter(Boolean), 'login');
  const missingAuthor = filteredPullRequests.find((edge) => !edge.node.author);
  if (missingAuthor) {
    console.log('Missing author', data.url, missingAuthor);
  }

  return {
    id: data.id,
    url: data.url,
    assignableUserCount: data.assignableUsers.totalCount,
    stargazerCount: data.stargazerCount,
    pullRequests: filteredPullRequests,
    pullRequestCount: filteredPullRequests.length,
    recentPullRequestAuthors: uniqAuthors.length, // Ensures unique authors
    watcherCount: data.watchers.totalCount,
    // releaseCount: data.releases.totalCount,
    forkCount: data.forkCount,
    authors: uniqAuthors
  };
}

export async function getRepositoryActivity({ cutoffDate, repos }: { cutoffDate: Date; repos: string[] }) {
  const totalRepos = repos.length;

  const perQuery = 50;

  const maxQueriedRepos = totalRepos;

  log.info(`Total repos to query: ${totalRepos}`);

  const allData: FlatRepositoryData[] = [];

  for (let i = 0; i <= maxQueriedRepos; i += perQuery) {
    const repoList = repos
      .slice(i, i + perQuery)
      .map((repo) => `repo:${repo.replace('https://github.com/', '')}`)
      .join(' ');

    if (repoList.length === 0) {
      break;
    }
    const results = await githubGrapghQLClient
      .query<{ search: { edges: { node: RepositoryData }[] } }>({
        query: repoMetdataQuery,
        variables: {
          repos: repoList
        }
      })
      .then(({ data }) => {
        return data.search.edges.map((edge) => mapToFlatObject(edge.node, cutoffDate));
      });

    await new Promise((resolve) => setTimeout(resolve, 1000));

    allData.push(...results);

    log.info(`Queried repos ${i + 1}-${i + Math.min(repoList.length, perQuery)} / ${maxQueriedRepos}`);
  }
  return allData;
}
