import fs from 'node:fs/promises';

import { Composite } from '@composedb/devtools';
import { createComposite, readEncodedComposite, writeEncodedComposite } from '@composedb/devtools-node';

import { getCeramicClient } from './authenticate';

async function generateCompositeFile() {
  const client = await getCeramicClient();

  const schema = await fs.readFile('lib/credentials/config/credentials.gql', 'utf-8');

  const compo = await Composite.create({
    ceramic: client,
    schema,
    index: false
  });
  await writeEncodedComposite(compo, 'lib/credentials/config/composite.json');
}

async function deployComposite() {
  const client = await getCeramicClient();

  const compo = await readEncodedComposite(client, 'lib/credentials/config/composite.json', true);
  await compo.startIndexingOn(client);
}

// eslint-disable-next-line no-console
generateCompositeFile().then(() => deployComposite().then(() => console.log('Done!')));
