import { ApolloClient, InMemoryCache } from '@apollo/client';

export function createSnapshotGraphqlClient(uri: string = 'https://hub.snapshot.org') {
  return new ApolloClient({
    uri: `${uri}/graphql`,
    cache: new InMemoryCache({})
  });
}

export const client = createSnapshotGraphqlClient();

// Every 15 seconds, clear the cached values in the client
setInterval(() => {
  client.cache.reset();
}, 15000);

export default client;
