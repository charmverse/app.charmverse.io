import { createComposite, readEncodedComposite, writeEncodedComposite } from '@composedb/devtools-node';

import { getCeramicClient } from './authenticate';

async function generateCompositeFile() {
  const client = await getCeramicClient();

  // await client.admin.pin.rm('kjzl6hvfrbw6c7nm0gnd3o3m5eep0zi0u6kbf6o2nfl3pxnn40mzcjhyezfs6ox' as any);

  // const models = await client.admin.pin.ls();

  // for (let i = 0; i < 3; i++) {
  //   const item = await models[Symbol.asyncIterator]().next();
  //   console.log({ item });
  // }

  // const compo = await readEncodedComposite(client, 'lib/credentials/config/credentials.gql');

  // console.log({ compo });

  // const composite = await createComposite(client, 'lib/credentials/config/credentials.gql');
  // console.log({ composite });
  // // Replace by the path to the encoded composite file
  // await writeEncodedComposite(composite, 'lib/credentials/config/composite.json');
}

// eslint-disable-next-line no-console
generateCompositeFile().then(() => console.log('Done!'));
