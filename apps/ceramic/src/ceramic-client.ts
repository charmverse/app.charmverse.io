/* eslint-disable import/no-extraneous-dependencies */
import { log } from '@charmverse/core/log';
import { serveEncodedDefinition } from '@composedb/devtools-node';

import { ceramicHost, getCeramicClient } from './authenticate';
import { compositeDefinitionFile } from './deploy-composites';

// Start the GraphQL server
async function bootstrapGqlServer() {
  const ceramic = await getCeramicClient();

  log.info(`GraphQL Composedb server started`);

  return serveEncodedDefinition({
    ceramicURL: ceramicHost,
    graphiql: true,
    path: compositeDefinitionFile,
    port: 5001,
    did: ceramic.did!
  });
}

const server = bootstrapGqlServer();

async function cleanup() {
  log.info('[server] Closing GraphQL server...');
  await (await server).stop();
  log.info('[server] Exiting process...');
  process.exit(0);
}

process.on('SIGINT', cleanup);
process.on('SIGTERM', cleanup);
