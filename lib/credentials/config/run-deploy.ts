/* eslint-disable no-console */
import { serveEncodedDefinition } from '@composedb/devtools-node';

import { ceramicHost } from 'config/constants';

import { getCeramicClient } from './authenticate';
import { compositeDefinitionFile, writeComposite } from './deploy-composites';

async function bootstrapGqlServer() {
  const ceramic = await getCeramicClient();

  await writeComposite();

  return serveEncodedDefinition({
    ceramicURL: ceramicHost,
    graphiql: true,
    path: compositeDefinitionFile,
    port: 5001,
    did: ceramic.did
  });
}

const server = bootstrapGqlServer();
console.log(`Server started`);

process.on('SIGTERM', async () => {
  (await server).stop();
  console.log('Server stopped');
});
