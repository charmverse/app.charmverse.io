
import { ApolloClient, InMemoryCache } from '@apollo/client';

export const client = new ApolloClient({
  uri: 'https://hub.snapshot.org/graphql',
  cache: new InMemoryCache({
  })
});

// Every 15 seconds, clear the cached values in the client
setInterval(() => {
  client.cache.reset();
}, 15000);

export default client;

