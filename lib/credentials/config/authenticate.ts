import { CeramicClient } from '@ceramicnetwork/http-client';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';

import { ceramicHost, ceramicSeed } from 'config/constants';

// Create the Ceramic object
export const ceramic = new CeramicClient(ceramicHost);

export async function getCeramicClient(): Promise<CeramicClient> {
  if (ceramic.did) {
    return ceramic;
  }

  function hexToBytes(hexString: string) {
    if (hexString.length % 2 !== 0) {
      throw new Error('Invalid hexadecimal string.');
    }

    const bytes = new Uint8Array(hexString.length / 2);

    for (let i = 0; i < bytes.length; i++) {
      bytes[i] = parseInt(hexString.substr(i * 2, 2), 16);
    }

    return bytes;
  }

  // Activate the account by somehow getting its seed.
  // See further down this page for more details on
  // seed format, generation, and key management.
  const provider = new Ed25519Provider(hexToBytes(ceramicSeed));
  // Create the DID object
  const did = new DID({ provider, resolver: getResolver() });
  // Authenticate with the provider
  await did.authenticate();
  // Mount the DID object to your Ceramic object
  ceramic.did = did;

  return ceramic;
}
