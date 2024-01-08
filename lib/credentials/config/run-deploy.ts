/* eslint-disable no-console */
import { serveEncodedDefinition } from '@composedb/devtools-node';

import { ceramicHost } from 'config/constants';

import { compositeDefinitionFile } from './deploy-composites';

async function bootstrapGqlServer() {
  return serveEncodedDefinition({
    ceramicURL: ceramicHost,
    graphiql: true,
    path: compositeDefinitionFile,
    port: 5001
  });
}

const server = bootstrapGqlServer();
console.log(`Server started`);

process.on('SIGTERM', async () => {
  (await server).stop();
  console.log('Server stopped');
});
