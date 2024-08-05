import { githubAccessToken } from '@root/config/constants';
import { ApolloClientWithRedisCache } from '@root/lib/credentials/apolloClientWithRedisCache';

import { GITHUB_GRAPHQL_BASE_URL } from './constants';

/**
 * GraphQL client for GitHub API
 * @explorer https://docs.github.com/en/graphql/overview/explorer
 */
export const githubGrapghQLClient = new ApolloClientWithRedisCache({
  persistForSeconds: 3600,
  uri: GITHUB_GRAPHQL_BASE_URL,
  authHeader: `Bearer ${githubAccessToken}`
});
