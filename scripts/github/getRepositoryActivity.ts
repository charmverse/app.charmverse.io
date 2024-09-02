import { gql } from '@apollo/client';
import { log } from '@charmverse/core/log';

import { githubGrapghQLClient } from 'lib/github/githubGraphQLClient';
import { uniqueValues } from 'lib/utils/array';

type RepositoryData = {
  url: string;
  assignableUsers: {
    totalCount: number;
  };
  stargazerCount: number;
  pullRequests: {
    edges: {
      node: {
        number: number;
        createdAt: string;
        updatedAt: string;
        author: {
          login: string;
        };
      };
    }[];
  };
  watchers: {
    totalCount: number;
  };
  releases: {
    totalCount: number;
  };
};

type FlatRepositoryData = {
  url: string;
  assignableUserCount: number;
  stargazerCount: number;
  pullRequestCount: number;
  recentPullRequestAuthors: string;
  watcherCount: number;
  releaseCount: number;
};

const repoMetdataQuery = gql`
  query ($repos: String!) {
    search(query: $repos, type: REPOSITORY, first: 10) {
      edges {
        node {
          ... on Repository {
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
                  author {
                    login
                  }
                }
              }
            }
            watchers {
              totalCount
            }
            releases(first: 10) {
              totalCount
              edges {
                node {
                  name

                  createdAt
                  mentions(first: 50) {
                    edges {
                      node {
                        login
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
  }
`;

function parseUrls(input: string): string[] {
  const urlRegex = /url\s*=\s*"([^"]+)"/g;
  const urls: string[] = [];
  let match;

  // eslint-disable-next-line no-cond-assign
  while ((match = urlRegex.exec(input)) !== null) {
    urls.push(match[1]);
  }

  return urls;
}

function mapToFlatObject(data: RepositoryData): FlatRepositoryData {
  const cutoffDate = new Date('2023-09-01');

  const filteredPullRequests = data.pullRequests.edges.filter((edge) => {
    const updatedAt = new Date(edge.node.updatedAt);

    return updatedAt >= cutoffDate;
  });

  const recentPullRequestAuthors = filteredPullRequests.map((edge) => edge.node.author.login);

  return {
    url: data.url,
    assignableUserCount: data.assignableUsers.totalCount,
    stargazerCount: data.stargazerCount,
    pullRequestCount: filteredPullRequests.length,
    recentPullRequestAuthors: uniqueValues(recentPullRequestAuthors).join(', '), // Ensures unique authors
    watcherCount: data.watchers.totalCount,
    releaseCount: data.releases.totalCount
  };
}

export async function getRepositoryActivity({ repos }: { repos: string[] }) {
  const totalRepos = repos.length;

  const perQuery = 10;

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
      .then(({ data }) => data.search.edges.map((edge) => mapToFlatObject(edge.node)));

    allData.push(...results);

    log.info(`Queried repos ${i + 1}-${i + Math.min(repoList.length, perQuery)} / ${maxQueriedRepos}`);
  }
  return allData;
}
