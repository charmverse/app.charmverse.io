import { CeramicClient } from '@ceramicnetwork/http-client';
import { GET } from '@charmverse/core/http';
import { DID } from 'dids';
import { Ed25519Provider } from 'key-did-provider-ed25519';
import { getResolver } from 'key-did-resolver';

import { POST } from 'adapters/http';
import { ceramicDid, ceramicHost, ceramicSeed } from 'config/constants';
import { stringToUint8Array } from 'lib/utilities/strings';

import type { SignedCredential } from './attest';

type CredentialToSave = {
  credential: SignedCredential;
};

const CERAMIC_HOST = process.env.CERAMIC_HOST as string;

export async function saveToCeramic({ credential }: CredentialToSave): Promise<any> {
  if (!CERAMIC_HOST) {
    throw new Error('Ceramic unavailable');
  }
  const response = await POST(`${CERAMIC_HOST}/api/attest`, credential);

  return response;
}
export async function getReceivedCredentials({ account }: { account: string }): Promise<any> {
  if (!CERAMIC_HOST) {
    throw new Error('Ceramic unavailable');
  }
  const response = await GET(`${CERAMIC_HOST}/api/all`, { account });

  return response;
}
// ↑ With this setup, you can perform read-only queries.
// ↓ Continue to authenticate the account and perform transactions.

// Create the Ceramic object
export const ceramic = new CeramicClient(ceramicHost);
export async function authenticateCeramic() {
  if (ceramic.did) {
    return;
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
}
// Connect to a Ceramic node

export async function writeToCeramic(message: any) {
  await authenticateCeramic();

  const result = await (ceramic.did as DID).createDagJWS(message);

  return result;
}

export async function readFromCeramic() {
  await authenticateCeramic();
}
export async function parseCeramicRecord(result: any) {
  function base64urlToBase64(base64url: string) {
    // Replace base64url characters with base64 characters
    let base64 = base64url.replace(/-/g, '+').replace(/_/g, '/');

    // Pad with '=' characters to make the string's length a multiple of 4
    while (base64.length % 4) {
      base64 += '=';
    }

    return base64;
  }

  const decodedPayload = atob(base64urlToBase64(result.jws.payload));
  const linkedBlockBytes = Object.values(result.linkedBlock);
  const linkedBlockString = String.fromCharCode(...(linkedBlockBytes as any));

  return {
    decodedPayload
  };
}
export async function getStreams() {
  await authenticateCeramic();

  const streams = await ceramic.pin.ls();

  return streams;
}
