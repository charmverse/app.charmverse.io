import type { CeramicClient } from '@ceramicnetwork/http-client';
import { readEncodedComposite, writeEncodedComposite } from '@composedb/devtools-node';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';

async function createComposite(ceramic: CeramicClient, schemaPath: string) {
  // Replace by the path to the source schema file
  const composite = await createComposite(ceramic, './credentials.graphql');
  // Replace by the path to the encoded composite file
  await writeEncodedComposite(composite, './credentials-composite.json');
}
