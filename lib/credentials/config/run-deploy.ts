/* eslint-disable no-console */
import { spawn } from 'child_process';
import { EventEmitter } from 'events';

import { serveEncodedDefinition } from '@composedb/devtools-node';
import ora from 'ora';

import { ceramicHost } from 'config/constants';

import { compositeDefinitionFile, writeComposite } from './deploy-composites';

async function bootstrapGqlServer() {
  return serveEncodedDefinition({
    ceramicURL: ceramicHost,
    graphiql: true,
    path: compositeDefinitionFile,
    port: 5001
  });
}

const server = await bootstrapGqlServer();
console.log(`Server started`);

process.on('SIGTERM', async () => {
  await server.stop();
  console.log('Server stopped');
});
