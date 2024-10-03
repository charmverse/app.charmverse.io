import { graphql } from '@octokit/graphql';

// Create an authenticated GraphQL client using your GitHub token
export function getClient() {
  return graphql.defaults({
    headers: {
      Authorization: `bearer ${process.env.GITHUB_ACCESS_TOKEN}`,
      'X-Github-Next-Global-ID': 0 // force the old style ids which we can parse
    }
  });
}
