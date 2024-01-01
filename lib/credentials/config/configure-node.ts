import { createComposite, writeEncodedComposite, readEncodedComposite } from '@composedb/devtools-node';

import { getCeramicClient } from './authenticate';

async function generateCompositeFile() {
  const client = await getCeramicClient();

  const models = await client.admin.getIndexedModels();

  console.log({ models });

  // const compo = await readEncodedComposite(client, 'modelData');

  // console.log({ compo });
  // // Replace by the path to the source schema file
  const composite = await createComposite(client, 'lib/credentials/config/credentials.gql');
  // Replace by the path to the encoded composite file
  await writeEncodedComposite(composite, 'lib/credentials/config/composite.json');
}

// eslint-disable-next-line no-console
generateCompositeFile().then(() => console.log('Done!'));
