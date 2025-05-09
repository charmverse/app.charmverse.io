import { ApolloClient, InMemoryCache } from '@apollo/client';

export function createGraphqlClient(uri: string) {
  return new ApolloClient({
    uri: `${uri}`,
    cache: new InMemoryCache({})
  });
}
