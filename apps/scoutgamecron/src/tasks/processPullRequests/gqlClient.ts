import { graphql } from '@octokit/graphql';

// Create an authenticated GraphQL client using your GitHub token
export function getClient() {
  return graphql.defaults({
    headers: {
      Authorization: `bearer ${process.env.SCOUTGAME_GITHUB_ACCESS_TOKEN}`
    }
  });
}
